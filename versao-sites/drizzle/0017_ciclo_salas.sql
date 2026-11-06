-- Suspensão retira o convidado de outras salas; reativação não o reinsere sem convite.
UPDATE sala_membros SET ativo=0
 WHERE ativo=1 AND usuario_id IN (SELECT id FROM usuarios WHERE suspenso=1)
 AND sala_id IN (SELECT s.id FROM salas s WHERE s.dono_id<>sala_membros.usuario_id);
--> statement-breakpoint
CREATE TRIGGER salas_afastar_convidado_suspenso
 AFTER UPDATE OF suspenso ON usuarios
 WHEN NEW.suspenso=1 AND OLD.suspenso=0
 BEGIN
  UPDATE sala_membros SET ativo=0
   WHERE usuario_id=NEW.id AND ativo=1
   AND sala_id IN (SELECT id FROM salas WHERE dono_id<>NEW.id);
 END;
