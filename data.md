Summary

  - Total dataset files: 36
  - Readable CSV files: 34
  - Excel files found: 2, but both appear unreadable/corrupt as normal .xlsx
  - Total rows across readable CSV files: 1,398,834
  - Total columns summed across readable CSV files: 381

  Processed training data

  ┌──────────────────────┬──────┬─────────┐
  │ File                 │ Rows │ Columns │
  ├──────────────────────┼──────┼─────────┤
  │ training_data.csv    │  117 │      19 │
  │ training_data_v2.csv │  117 │      19 │
  └──────────────────────┴──────┴─────────┘

  Raw MIMIC demo data

  ┌────────────────────────┬─────────┬─────────┐
  │ File                   │    Rows │ Columns │
  ├────────────────────────┼─────────┼─────────┤
  │ chartevents.csv        │ 668,862 │      11 │
  │ d_icd_diagnoses.csv    │ 109,775 │       3 │
  │ labevents.csv          │ 107,727 │      16 │
  │ d_hcpcs.csv            │  89,200 │       4 │
  │ d_icd_procedures.csv   │  85,257 │       3 │
  │ emar_detail.csv        │  72,018 │      33 │
  │ poe.csv                │  45,154 │      12 │
  │ provider.csv           │  40,508 │       1 │
  │ emar.csv               │  35,835 │      12 │
  │ ingredientevents.csv   │  25,728 │      17 │
  │ inputevents.csv        │  20,404 │      26 │
  │ pharmacy.csv           │  15,306 │      27 │
  │ caregiver.csv          │  15,468 │       1 │
  │ datetimeevents.csv     │  15,280 │      10 │
  │ prescriptions.csv      │  18,087 │      21 │
  │ outputevents.csv       │   9,362 │       9 │
  │ diagnoses_icd.csv      │   4,506 │       5 │
  │ d_items.csv            │   4,014 │       9 │
  │ poe_detail.csv         │   3,795 │       5 │
  │ omr.csv                │   2,964 │       5 │
  │ microbiologyevents.csv │   2,899 │      25 │
  │ d_labitems.csv         │   1,622 │       4 │
  │ procedureevents.csv    │   1,468 │      22 │
  │ transfers.csv          │   1,190 │       7 │
  │ procedures_icd.csv     │     722 │       6 │
  │ drgcodes.csv           │     454 │       7 │
  │ services.csv           │     319 │       5 │
  │ admissions.csv         │     275 │      16 │
  │ icustays.csv           │     140 │       8 │
  │ patients.csv           │     100 │       6 │
  │ demo_subject_id.csv    │     100 │       1 │
  │ hcpcsevents.csv        │      61 │       6 │
  └────────────────────────┴─────────┴─────────┘

  The 2 Excel files are ICU Sepsis Dataset.xlsx and fixed.xlsx; they are present but could
  not be parsed normally, so I did not include them in the row/column totals.