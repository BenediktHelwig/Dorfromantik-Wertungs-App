<?php

declare(strict_types=1);

namespace OCA\Dorfromantik\Controller;

use OCA\Dorfromantik\AppInfo\Application;
use OCA\Dorfromantik\Db\CampaignMapper;
use OCA\Dorfromantik\Service\RawCampaign;
use OCP\AppFramework\Controller;
use OCP\AppFramework\Http;
use OCP\AppFramework\Http\Attribute\NoAdminRequired;
use OCP\AppFramework\Http\JSONResponse;
use OCP\IRequest;

/**
 * Kampagnen als Rohdaten. Sie gelten gemeinsam für alle angemeldeten Nutzer; wer die App sieht, regelt
 * Nextcloud über "Für Gruppen aktivieren". Es gibt keine Versionsprüfung, das letzte Speichern gilt
 * (docs/entscheidungen.md, 25.11.2026). Alle Anfragen brauchen Anmeldung und CSRF-Schutz.
 */
class CampaignController extends Controller {
	private const MAX_BYTES = 1_000_000;

	public function __construct(
		IRequest $request,
		private CampaignMapper $campaigns,
	) {
		parent::__construct(Application::APP_ID, $request);
	}

	#[NoAdminRequired]
	public function index(): JSONResponse {
		return new JSONResponse(array_map(static fn (string $data): mixed => json_decode($data), $this->campaigns->findAll()));
	}

	#[NoAdminRequired]
	public function save(string $campaignId): JSONResponse {
		$body = (string)file_get_contents('php://input', false, null, 0, self::MAX_BYTES + 1);
		if (strlen($body) > self::MAX_BYTES) {
			return self::error('Die Kampagne ist zu groß', Http::STATUS_REQUEST_ENTITY_TOO_LARGE);
		}
		$error = RawCampaign::validate(json_decode($body), $campaignId);
		if ($error !== null) {
			return self::error($error, Http::STATUS_BAD_REQUEST);
		}
		$stored = $this->campaigns->find($campaignId);
		if ($stored === null) {
			$this->campaigns->insert($campaignId, $body);
		} elseif (json_decode($stored)->endDate !== null) {
			return self::error('Die Kampagne ist beendet und schreibgeschützt', Http::STATUS_CONFLICT);
		} else {
			$this->campaigns->update($campaignId, $body);
		}
		return new JSONResponse(['id' => $campaignId]);
	}

	#[NoAdminRequired]
	public function destroy(string $campaignId): JSONResponse {
		if (!$this->campaigns->delete($campaignId)) {
			return self::error('Diese Kampagne gibt es nicht', Http::STATUS_NOT_FOUND);
		}
		return new JSONResponse(['id' => $campaignId]);
	}

	private static function error(string $message, int $status): JSONResponse {
		return new JSONResponse(['message' => $message], $status);
	}
}
