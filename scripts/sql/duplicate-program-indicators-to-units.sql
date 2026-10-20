-- Duplikasi indikator yang dipilih ke tiga unit, tetap memakai program asal.
-- Jalankan seluruh skrip dalam satu koneksi MySQL.
-- PIC, realisasi, approval, dan dokumen tidak disalin.
START TRANSACTION;

INSERT INTO program_indicators (
    id, program_id, unit_id, name, master_unit_type_id,
    category, is_default_program_indicator,
    target_q1, target_q2, target_q3, target_q4, budget,
    status, `order`, created_at, updated_at
)
SELECT
    UUID(), src.program_id, dest.unit_id, src.name, src.master_unit_type_id,
    src.category, src.is_default_program_indicator,
    src.target_q1, src.target_q2, src.target_q3, src.target_q4, src.budget,
    'ASSIGNED_TO_UNIT', src.`order`, NOW(3), NOW(3)
FROM program_indicators AS src
CROSS JOIN (
    SELECT 'bf4e79e3-4461-452e-b964-679e5b02e2cd' AS unit_id
    UNION ALL
    SELECT '1cd6c9d7-7919-4b51-9737-3440cee766fa' AS unit_id
    UNION ALL
    SELECT '67b3b9a1-79f5-4cf4-ba4c-1cec25fe3b34' AS unit_id
) AS dest
WHERE src.unit_id = '4f2664d3-2fab-4d1d-8083-06321cd704c8'
  AND src.id IN (
      '14b09b94-1ac8-4b29-959f-1260fa3ee036',
      '17b8d21a-295e-44c4-b57e-2d7084cb2ba3',
      '1817b84b-7383-43f3-a835-45ec9d20bd56',
      '1aeae533-a26a-4f78-9cb1-066a70ffcb62',
      '1b6e9e42-46ae-4970-ab48-d29cff5c646d',
      '209e4c70-11ba-4145-977b-ec4ba22f4be3',
      '21ce6a7b-4cf3-4952-8d17-20893fe4bfe5',
      '28f3c4b5-c2b4-45f4-abc3-b693fda945d5',
      '33b3f3a5-3ff7-47de-829e-7413224f4666',
      '33bcdd1c-cd85-400d-a000-58a984235d22',
      '49c87fb0-1ebb-4ebe-9b43-4a8c52a2a3c2',
      '51f6d7cc-cd52-4f47-86e0-4620732058e2',
      '532e51e0-4773-4839-abd5-5f4745b471aa',
      '57043570-584f-4cd3-8064-d7b308593984',
      '5c4cdf07-af7c-4635-acab-19338603b736',
      '5f015b0d-5165-4522-883f-ea4969a57512',
      '67fe1d9a-3d04-4210-b9c3-1add7eb5992b',
      '6aadbfa7-d3d9-468b-85de-6b6cae825d04',
      '8e2f031e-ce25-4bb3-964f-fe3259ec36e9',
      '92594d96-47a4-4c27-9494-2c0641e59b57',
      '9914af7c-70a1-4761-a3b8-c759fa6eccc9',
      'a343b760-9966-4f7c-bbe0-4671f77a6e3d',
      'bd4cc73c-ac5b-4b31-8ec9-79383e6254a4',
      'd6bc70d7-cc1d-4d45-9a3f-6b09d5045ab4',
      'd6cba8c6-5853-4799-a0f1-d82b9fa52948',
      'd71716b6-09da-41ce-a9c8-342474455918',
      'd84d7dbf-1671-43bc-8b7c-de9b9fd06dc9'
  )
  AND NOT EXISTS (
      SELECT 1
      FROM program_indicators AS existing
      WHERE existing.program_id = src.program_id
        AND existing.unit_id = dest.unit_id
        AND existing.name = src.name
  );

-- Maksimal 81 baris baru jika semua sumber tersedia dan tujuan belum memiliki indikator.
SELECT ROW_COUNT() AS jumlah_indikator_disalin;

COMMIT;
