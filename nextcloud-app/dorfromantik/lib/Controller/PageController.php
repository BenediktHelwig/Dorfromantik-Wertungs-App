<?php

declare(strict_types=1);

namespace OCA\Dorfromantik\Controller;

use OCA\Dorfromantik\AppInfo\Application;
use OCP\App\IAppManager;
use OCP\AppFramework\Controller;
use OCP\AppFramework\Http\Attribute\NoAdminRequired;
use OCP\AppFramework\Http\Attribute\NoCSRFRequired;
use OCP\AppFramework\Http\ContentSecurityPolicy;
use OCP\AppFramework\Http\TemplateResponse;
use OCP\IRequest;
use OCP\IURLGenerator;

/**
 * Liefert die Oberfläche als eigenständige Seite (ohne Nextcloud-Rahmen). Nur so sind Manifest und
 * Home-Bildschirm-Icon der App wirksam: Der Nextcloud-Rahmen setzt seine eigenen davor.
 */
class PageController extends Controller {
	public function __construct(
		IRequest $request,
		private IURLGenerator $urls,
		private IAppManager $apps,
	) {
		parent::__construct(Application::APP_ID, $request);
	}

	#[NoAdminRequired]
	#[NoCSRFRequired]
	public function index(): TemplateResponse {
		$app = Application::APP_ID;
		$response = new TemplateResponse($app, 'main', [
			'scriptUrl' => $this->asset('js/dorfromantik-main.js'),
			'styleUrl' => $this->asset('js/dorfromantik-main.css'),
			'manifestUrl' => PwaController::indexUrl($this->urls, 'manifest.webmanifest'),
			'workerUrl' => PwaController::indexUrl($this->urls, 'sw.js'),
			'scope' => $this->urls->linkToRoute('dorfromantik.page.index'),
			'apiUrl' => $this->urls->linkToRoute('dorfromantik.campaign.index'),
			'homeUrl' => $this->urls->getWebroot() . '/',
			'iconUrl' => $this->urls->linkTo($app, 'img/icon-180.png'),
		], TemplateResponse::RENDER_AS_BLANK);

		$policy = new ContentSecurityPolicy();
		$policy->addAllowedWorkerSrcDomain("'self'");
		$response->setContentSecurityPolicy($policy);
		return $response;
	}

	/** Adresse einer Datei der App; der Zeitstempel sorgt nach einem Update für die neue Fassung. */
	private function asset(string $file): string {
		$path = $this->apps->getAppPath(Application::APP_ID) . '/' . $file;
		$version = is_file($path) ? (string)filemtime($path) : '0';
		return $this->urls->linkTo(Application::APP_ID, $file) . '?v=' . $version;
	}
}
