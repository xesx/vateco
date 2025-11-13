ALTER TABLE workflow_template RENAME TO workflow_templates;

ALTER TABLE workflow_templates RENAME CONSTRAINT workflow_template_pkey TO workflow_templates_pkey;


ALTER TABLE workflow_variant RENAME TO workflow_variants;

ALTER TABLE workflow_variants RENAME CONSTRAINT workflow_variant_pkey TO workflow_variants_pkey;
ALTER TABLE workflow_variants RENAME CONSTRAINT workflow_variant_workflow_template_id_fkey TO workflow_variants_workflow_template_id_fkey;

DROP INDEX IF EXISTS workflow_variant_name_key;
CREATE UNIQUE INDEX workflow_variants_name_key ON workflow_variants("name");
