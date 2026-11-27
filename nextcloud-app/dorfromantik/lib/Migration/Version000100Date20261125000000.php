<?php

declare(strict_types=1);

namespace OCA\Dorfromantik\Migration;

use Closure;
use OCP\DB\ISchemaWrapper;
use OCP\DB\Types;
use OCP\Migration\IOutput;
use OCP\Migration\SimpleMigrationStep;

/**
 * Eine Zeile je Kampagne, gemeinsam für alle Nutzer der Instanz. "data" enthält ausschließlich Rohdaten
 * als JSON (siehe lib/Service/RawCampaign.php); Abgeleitetes rechnet die Oberfläche mit dem Kern neu.
 */
class Version000100Date20261125000000 extends SimpleMigrationStep {
	public function changeSchema(IOutput $output, Closure $schemaClosure, array $options): ?ISchemaWrapper {
		/** @var ISchemaWrapper $schema */
		$schema = $schemaClosure();
		if ($schema->hasTable('dorfromantik_campaigns')) {
			return null;
		}
		$table = $schema->createTable('dorfromantik_campaigns');
		$table->addColumn('id', Types::STRING, ['notnull' => true, 'length' => 64]);
		$table->addColumn('data', Types::TEXT, ['notnull' => true]);
		$table->addColumn('updated_at', Types::BIGINT, ['notnull' => true]);
		$table->setPrimaryKey(['id'], 'dorfr_campaigns_pk');
		return $schema;
	}
}
