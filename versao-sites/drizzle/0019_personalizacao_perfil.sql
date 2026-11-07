ALTER TABLE perfis_sociais ADD COLUMN visual TEXT NOT NULL DEFAULT '{"capa":"origem","moldura":"essencial","aura":"brisa"}'
 CONSTRAINT perfil_visual CHECK(json_valid(visual) AND json_type(visual)='object');
--> statement-breakpoint
UPDATE perfis_sociais SET visual='{"capa":"pessoal","moldura":"essencial","aura":"brisa"}' WHERE banner<>'';
