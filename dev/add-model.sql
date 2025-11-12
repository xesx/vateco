DO $$
DECLARE
    model_id INT;
    _model_name TEXT := 'il_xl_v02';
    _comfy_ui_directory TEXT := 'checkpoints';
    _comfy_ui_file_name TEXT := 'il_xl_v02.safetensors';
    _label TEXT := 'IL XL v2.0';
    _description TEXT := '';
    _meta JSONB := '{}';
BEGIN
    SELECT id INTO model_id
      FROM models
     WHERE name = _model_name;

    INSERT INTO models (name, comfy_ui_directory, comfy_ui_file_name, label, description, meta)
    VALUES  (
            _model_name
          , _comfy_ui_directory
          , _comfy_ui_file_name
          , _label
          , _description
          , _meta
    )
    ON CONFLICT (name) DO NOTHING
    RETURNING id INTO model_id;

    IF model_id IS NULL THEN
    END IF;

    INSERT INTO model_tags (model_id, tag)
    VALUES (model_id, 'sd')
         , (model_id, 'illustrious')
    ON CONFLICT DO NOTHING;

    INSERT INTO model_huggingface_links (model_id, repo, file)
    VALUES (model_id, 'OnomaAIResearch/Illustrious-XL-v2.0', 'Illustrious-XL-v2.0.safetensors')
      --   , (model_id, 'alalarty/models2', 'il/honeysIllustrious_10.safetensors')
    ON CONFLICT DO NOTHING;
END $$;