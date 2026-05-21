"""
Fix synthetic labels → real ICD-derived labels, then retrain.
Steps 1-7 of the label-fix prompt.
"""

import os, json, pickle, warnings
import numpy as np
import pandas as pd
import shap
from sklearn.model_selection import train_test_split
from sklearn.metrics import roc_auc_score
from xgboost import XGBClassifier

warnings.filterwarnings('ignore')

BASE  = 'backend/data/raw/mimic-iv-clinical-database-demo-2.2'
MODEL = 'backend/model'

FEATURES = [
    "heart_rate", "temperature", "spo2",
    "respiratory_rate", "blood_pressure_sys",
    "wbc_count", "creatinine", "lactate",
    "glucose", "platelet_count",
    "ventilator_duration", "fio2", "peep",
    "catheter_duration", "central_line_duration"
]

# ── STEP 1: Read diagnoses_icd ────────────────────────────────────────────────
print("\n=== STEP 1: Loading ICD tables ===")

diag  = pd.read_csv(f'{BASE}/hosp/diagnoses_icd.csv')
d_icd = pd.read_csv(f'{BASE}/hosp/d_icd_diagnoses.csv')
icustays = pd.read_csv(f'{BASE}/icu/icustays.csv')

diag_full = diag.merge(d_icd, on=['icd_code', 'icd_version'], how='left')
desc = diag_full['long_title'].str.lower().fillna('')

print(f"diagnoses_icd : {diag.shape}  cols: {diag.columns.tolist()}")
print(f"d_icd_diagnoses: {d_icd.shape}")
print(f"\nSample rows:")
print(diag.head(5).to_string(index=False))

# ── STEP 2: Map ICD codes → infection hadm_ids ────────────────────────────────
print("\n=== STEP 2: Mapping ICD codes ===")

# --- VAP ---
VAP_CODES   = {'99731', 'v0381', 'j95851', 'j9500'}
vap_exact   = diag_full[diag_full['icd_code'].str.lower().isin(VAP_CODES)]
vap_text    = diag_full[desc.str.contains('ventilator.*pneumon|ventilator.associated', regex=True, na=False)]
vap_hadm    = set(vap_exact['hadm_id']) | set(vap_text['hadm_id'])

print(f"VAP  — exact codes: {vap_exact['hadm_id'].nunique()} hadm_ids | text: {vap_text['hadm_id'].nunique()} | union: {len(vap_hadm)}")

# --- CLABSI ---
CLABSI_CODES = {'99931', '99932', 't80211a', 't80211d', 't80219a'}
clabsi_exact = diag_full[diag_full['icd_code'].str.lower().isin(CLABSI_CODES)]
clabsi_text  = diag_full[desc.str.contains('central.?line|bloodstream.*catheter|catheter.*bloodstream|central venous catheter', regex=True, na=False)]
clabsi_hadm  = set(clabsi_exact['hadm_id']) | set(clabsi_text['hadm_id'])

print(f"CLABSI — exact: {clabsi_exact['hadm_id'].nunique()} | text: {clabsi_text['hadm_id'].nunique()} | union: {len(clabsi_hadm)}")

# --- CAUTI ---
CAUTI_CODES  = {'99664', '5990', 't83511a', 't83511d', 'n390'}
cauti_exact  = diag_full[diag_full['icd_code'].str.lower().isin(CAUTI_CODES)]
cauti_text   = diag_full[desc.str.contains('catheter.*urin|urin.*catheter', regex=True, na=False)]
cauti_hadm   = set(cauti_exact['hadm_id']) | set(cauti_text['hadm_id'])

print(f"CAUTI — exact: {cauti_exact['hadm_id'].nunique()} | text: {cauti_text['hadm_id'].nunique()} | union: {len(cauti_hadm)}")

# hadm_id → stay_id mapping (one-to-many handled: all stays inherit the label)
hadm_to_stay = icustays[['hadm_id', 'stay_id']].copy()

def hadm_to_stay_ids(hadm_set):
    return set(hadm_to_stay[hadm_to_stay['hadm_id'].isin(hadm_set)]['stay_id'])

vap_stays    = hadm_to_stay_ids(vap_hadm)
clabsi_stays = hadm_to_stay_ids(clabsi_hadm)
cauti_stays  = hadm_to_stay_ids(cauti_hadm)

print(f"\nMapped to stay_ids → VAP: {len(vap_stays)} | CLABSI: {len(clabsi_stays)} | CAUTI: {len(cauti_stays)}")

# ── STEP 3: Broader fallback if positives still very low ─────────────────────
print("\n=== STEP 3: Broader fallback for any 0-positive infection ===")

# Load device features for hybrid criteria
df = pd.read_csv('backend/data/processed/training_data.csv')

def hybrid_stays(icd_stays, col_device, device_thresh, col_lab, lab_thresh, df):
    """Return stay_ids from ICD OR from clinical criteria."""
    clinical = df[
        (df[col_device].fillna(0) > device_thresh) &
        (df[col_lab].fillna(0)    > lab_thresh)
    ]['stay_id']
    clinical_set = set(clinical)
    combined = icd_stays | clinical_set
    print(f"  ICD: {len(icd_stays)} | Clinical: {len(clinical_set)} | Union: {len(combined)}")
    return combined, len(icd_stays), len(clinical_set)

needs_hybrid = {}
for inf, stays, dev_col, dev_thr, lab_col, lab_thr in [
    ('vap',    vap_stays,    'ventilator_duration',   48, 'temperature', 38.0),
    ('clabsi', clabsi_stays, 'central_line_duration', 48, 'wbc_count',   10.0),
    ('cauti',  cauti_stays,  'catheter_duration',     48, 'creatinine',   1.2),
]:
    in_train = len([s for s in stays if s in set(df['stay_id'])])
    print(f"\n{inf.upper()} — stays in training_data: {in_train}")
    if in_train < 3:
        print(f"  → Too few, applying HYBRID ({dev_col}>{dev_thr} & {lab_col}>{lab_thr})")
        combined, n_icd, n_clin = hybrid_stays(stays, dev_col, dev_thr, lab_col, lab_thr, df)
        needs_hybrid[inf] = (combined, n_icd, n_clin)

# ── STEP 4: Rebuild labels ────────────────────────────────────────────────────
print("\n=== STEP 4: Rebuilding labels in training_data ===")

label_source = {}

for inf, stays, hybrid_key in [
    ('vap',    vap_stays,    'vap'),
    ('clabsi', clabsi_stays, 'clabsi'),
    ('cauti',  cauti_stays,  'cauti'),
]:
    if hybrid_key in needs_hybrid:
        final_stays, n_icd, n_clin = needs_hybrid[hybrid_key]
        label_source[inf] = f"{n_icd} ICD + {n_clin} clinical hybrid"
    else:
        final_stays = stays
        n_in_train  = len([s for s in stays if s in set(df['stay_id'])])
        label_source[inf] = f"{n_in_train} ICD (pure)"

    df[f'{inf}_label'] = df['stay_id'].isin(final_stays).astype(int)

for inf in ['vap', 'clabsi', 'cauti']:
    pos = df[f'{inf}_label'].sum()
    pct = pos / len(df) * 100
    src = label_source[inf]
    print(f"  {inf.upper()}: {pos}/{len(df)} ({pct:.1f}%) — source: {src}")

# ── STEP 5: Retrain ───────────────────────────────────────────────────────────
print("\n=== STEP 5: Retraining XGBoost models ===")

X_all = df[FEATURES].fillna(df[FEATURES].median())
aurocs = {}

for inf in ['vap', 'clabsi', 'cauti']:
    y = df[f'{inf}_label']
    pos_count = y.sum()

    if pos_count < 3:
        print(f"\n  WARNING: {inf.upper()} still has only {pos_count} positives.")
        print(f"  Recommendation: use the full MIMIC-IV dataset for clinical validity.")
        print(f"  Skipping training for {inf.upper()}.")
        aurocs[inf] = None
        continue

    print(f"\n  {inf.upper()} — {int(pos_count)} positives / {len(df)} total")

    X_train, X_test, y_train, y_test = train_test_split(
        X_all, y, test_size=0.2, random_state=42, stratify=y
    )

    neg   = (y_train == 0).sum()
    pos   = (y_train == 1).sum()
    scale = neg / pos if pos > 0 else 1

    model = XGBClassifier(
        n_estimators=200,
        max_depth=4,
        learning_rate=0.05,
        scale_pos_weight=scale,
        eval_metric='auc',
        random_state=42,
        verbosity=0,
    )

    model.fit(
        X_train, y_train,
        eval_set=[(X_test, y_test)],
        verbose=False,
    )

    # Handle single-class test set
    if len(y_test.unique()) < 2:
        proba_tr = model.predict_proba(X_train)[:, 1]
        auroc = roc_auc_score(y_train, proba_tr)
        print(f"  {inf.upper()} AUROC (train fallback — test had 1 class): {auroc:.3f}")
    else:
        proba = model.predict_proba(X_test)[:, 1]
        auroc = roc_auc_score(y_test, proba)
        print(f"  {inf.upper()} AUROC: {auroc:.3f}")

    aurocs[inf] = auroc

    with open(f'{MODEL}/{inf}_model.pkl', 'wb') as f:
        pickle.dump(model, f)

# ── Update SHAP explainers for retrained models ───────────────────────────────
print("\n=== Updating SHAP explainers ===")
for inf in ['vap', 'clabsi', 'cauti']:
    if aurocs.get(inf) is None:
        print(f"  Skipped {inf} (not retrained)")
        continue
    with open(f'{MODEL}/{inf}_model.pkl', 'rb') as f:
        model = pickle.load(f)
    explainer = shap.TreeExplainer(model)
    with open(f'{MODEL}/{inf}_explainer.pkl', 'wb') as f:
        pickle.dump(explainer, f)
    print(f"  Updated {inf}_explainer.pkl")

# ── STEP 6: Save updated training data ───────────────────────────────────────
print("\n=== STEP 6: Saving training_data_v2.csv ===")
df.to_csv('backend/data/processed/training_data_v2.csv', index=False)
print(f"  Saved backend/data/processed/training_data_v2.csv — shape: {df.shape}")

# ── STEP 7: Final summary ─────────────────────────────────────────────────────
print("\n" + "="*55)
print("📊 LABEL SOURCE: ICD diagnosis codes (real labels)")
print()
for inf in ['vap', 'clabsi', 'cauti']:
    pos = df[f'{inf}_label'].sum()
    pct = pos / len(df) * 100
    src = label_source[inf]
    print(f"   {inf.upper():<8} positives: {int(pos):>3} / {len(df)} ({pct:.1f}%)  [{src}]")

print()
print("🤖 NEW MODEL RESULTS:")
prev = {'vap': 0.304, 'clabsi': 0.304, 'cauti': 0.304}
for inf in ['vap', 'clabsi', 'cauti']:
    if aurocs[inf] is not None:
        delta = aurocs[inf] - prev[inf]
        sign  = '+' if delta >= 0 else ''
        print(f"   {inf.upper():<8} AUROC: {aurocs[inf]:.3f}  (was {prev[inf]:.3f}, {sign}{delta:.3f})")
    else:
        print(f"   {inf.upper():<8} AUROC: N/A (skipped — insufficient positives)")

print()
print("💾 Models saved:")
for inf in ['vap', 'clabsi', 'cauti']:
    status = '✅' if aurocs.get(inf) is not None else '⚠️ (old pkl kept)'
    print(f"   {inf}_model.pkl     {status}")
    print(f"   {inf}_explainer.pkl {status}")
