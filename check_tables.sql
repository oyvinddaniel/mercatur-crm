SELECT 
  table_name,
  EXISTS (
    SELECT FROM pg_tables 
    WHERE schemaname = 'public' 
    AND tablename = table_name
  ) as exists
FROM (
  VALUES 
    ('profiles'),
    ('customers'),
    ('contacts'),
    ('communication_logs'),
    ('deals')
) AS tables(table_name);
