Novos nomes das politicas.

Name: Policy para delete 1dduyc3_0
Command: DELETE
USING expression: ((bucket_id = 'crm-anexos'::text) AND (auth.uid() = owner))

Name: Policy para delete 1dduyc3_1
Command: SELECT
USING expression: ((bucket_id = 'crm-anexos'::text) AND (auth.uid() = owner))

Name: Policy para leitura 1dduyc3_0
Command: SELECT
USING expression: (bucket_id = 'crm-anexos'::text)

Name: Policy para upload 1dduyc3_0
Command: INSERT
USING expression: (bucket_id = 'crm-anexos'::text)

