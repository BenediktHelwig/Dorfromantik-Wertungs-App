<?php

declare(strict_types=1);

namespace OCA\Dorfromantik\Service;

use stdClass;

/**
 * Prüft eine gesendete Kampagne auf das Rohdaten-Prinzip: Gespeichert werden nur Wertungsblätter und
 * Entscheidungen, genau die Felder aus src/core/campaigns.js. Abgeleitetes oder Unbekanntes wird abgelehnt.
 * Die Spielregeln selbst prüft der Kern in der Oberfläche.
 *
 * Gelesen wird mit Objekten statt assoziativen Arrays, damit leere Objekte ({}) nicht zu Listen ([]) werden.
 */
class RawCampaign {
	private const COMMON = ['id', 'startDate', 'endDate', 'sheets', 'decisions', 'manualUnlocks'];
	private const BASIS = ['manualReceived'];
	private const SAKURA = ['variant', 'collector', 'gameEnds'];
	private const ID = '/^[A-Za-z0-9-]{1,64}$/D';
	private const DATE = '/^\d{4}-\d{2}-\d{2}$/D';

	/** @return string|null Fehlertext, null = in Ordnung */
	public static function validate(mixed $campaign, string $id): ?string {
		if (!$campaign instanceof stdClass) {
			return 'Keine lesbare Kampagne';
		}
		$fields = get_object_vars($campaign);
		$sakura = array_key_exists('variant', $fields);
		$expected = array_merge(self::COMMON, $sakura ? self::SAKURA : self::BASIS);
		$unknown = array_diff(array_keys($fields), $expected);
		if ($unknown !== []) {
			return 'Nur Rohdaten werden gespeichert, unbekannt: ' . implode(', ', $unknown);
		}
		$missing = array_diff($expected, array_keys($fields));
		if ($missing !== []) {
			return 'Es fehlt: ' . implode(', ', $missing);
		}

		$checks = [
			'id' => is_string($fields['id']) && preg_match(self::ID, $fields['id']) === 1 && $fields['id'] === $id,
			'startDate' => self::isDate($fields['startDate']),
			'endDate' => $fields['endDate'] === null || self::isDate($fields['endDate']),
			'sheets' => self::isListOfObjects($fields['sheets']) && $fields['sheets'] !== [],
			'decisions' => self::isListOfObjects($fields['decisions']),
			'manualUnlocks' => $fields['manualUnlocks'] instanceof stdClass,
		];
		if ($sakura) {
			$checks['variant'] = $fields['variant'] === 'sakura';
			$checks['collector'] = $fields['collector'] === null || is_string($fields['collector']);
			$checks['gameEnds'] = $fields['gameEnds'] instanceof stdClass;
		} else {
			$checks['manualReceived'] = is_array($fields['manualReceived']);
		}
		$invalid = array_keys(array_filter($checks, static fn (bool $ok): bool => !$ok));
		return $invalid === [] ? null : 'Ungültig: ' . implode(', ', $invalid);
	}

	private static function isDate(mixed $value): bool {
		return is_string($value) && preg_match(self::DATE, $value) === 1;
	}

	private static function isListOfObjects(mixed $value): bool {
		return is_array($value) && array_filter($value, static fn (mixed $v): bool => !$v instanceof stdClass) === [];
	}
}
