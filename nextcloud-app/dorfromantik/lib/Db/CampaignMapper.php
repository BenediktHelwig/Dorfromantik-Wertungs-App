<?php

declare(strict_types=1);

namespace OCA\Dorfromantik\Db;

use OCP\IDBConnection;

/** Speicher der Kampagnen: Id und Rohdaten als JSON-Text, unverändert wie gesendet. */
class CampaignMapper {
	private const TABLE = 'dorfromantik_campaigns';

	public function __construct(
		private IDBConnection $db,
	) {
	}

	/** @return list<string> JSON-Texte aller Kampagnen */
	public function findAll(): array {
		$query = $this->db->getQueryBuilder();
		$query->select('data')->from(self::TABLE)->orderBy('id');
		$result = $query->executeQuery();
		$rows = $result->fetchAll();
		$result->closeCursor();
		return array_map(static fn (array $row): string => (string)$row['data'], $rows);
	}

	public function find(string $id): ?string {
		$query = $this->db->getQueryBuilder();
		$query->select('data')->from(self::TABLE)
			->where($query->expr()->eq('id', $query->createNamedParameter($id)));
		$result = $query->executeQuery();
		$row = $result->fetch();
		$result->closeCursor();
		return $row === false ? null : (string)$row['data'];
	}

	public function insert(string $id, string $data): void {
		$query = $this->db->getQueryBuilder();
		$query->insert(self::TABLE)->values([
			'id' => $query->createNamedParameter($id),
			'data' => $query->createNamedParameter($data),
			'updated_at' => $query->createNamedParameter(time()),
		]);
		$query->executeStatement();
	}

	public function update(string $id, string $data): void {
		$query = $this->db->getQueryBuilder();
		$query->update(self::TABLE)
			->set('data', $query->createNamedParameter($data))
			->set('updated_at', $query->createNamedParameter(time()))
			->where($query->expr()->eq('id', $query->createNamedParameter($id)));
		$query->executeStatement();
	}

	/** @return bool false, wenn es die Kampagne nicht gab */
	public function delete(string $id): bool {
		$query = $this->db->getQueryBuilder();
		$query->delete(self::TABLE)
			->where($query->expr()->eq('id', $query->createNamedParameter($id)));
		return $query->executeStatement() > 0;
	}
}
