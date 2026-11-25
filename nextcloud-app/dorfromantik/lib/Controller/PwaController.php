<?php

declare(strict_types=1);

namespace OCA\Dorfromantik\Controller;

use OCA\Dorfromantik\AppInfo\Application;
use OCP\App\IAppManager;
use OCP\AppFramework\Controller;
use OCP\AppFramework\Http\Attribute\NoCSRFRequired;
use OCP\AppFramework\Http\Attribute\PublicPage;
use OCP\AppFramework\Http\ContentSecurityPolicy;
use OCP\AppFramework\Http\DataDisplayResponse;
use OCP\IRequest;
use OCP\IURLGenerator;

/**
 * Manifest und Service Worker. Beide sind ohne Anmeldung abrufbar, weil Browser sie auch ohne Cookies laden;
 * sie enthalten keine Daten.
 */
class PwaController extends Controller {
	public function __construct(
		IRequest $request,
		private IURLGenerator $urls,
		private IAppManager $apps,
	) {
		parent::__construct(Application::APP_ID, $request);
	}

	/**
	 * Adresse immer über index.php: Bei "schönen URLs" liefert Apache *.js als Datei aus und fände den
	 * Service Worker sonst nicht.
	 */
	public static function indexUrl(IURLGenerator $urls, string $file): string {
		return $urls->getWebroot() . '/index.php/apps/' . Application::APP_ID . '/' . $file;
	}

	#[PublicPage]
	#[NoCSRFRequired]
	public function manifest(): DataDisplayResponse {
		$start = $this->urls->linkToRoute('dorfromantik.page.index');
		$icons = [];
		foreach ([192, 512] as $size) {
			$icons[] = [
				'src' => $this->urls->linkTo(Application::APP_ID, "img/icon-$size.png"),
				'sizes' => "{$size}x{$size}",
				'type' => 'image/png',
				'purpose' => 'any maskable',
			];
		}
		$manifest = [
			'name' => 'Dorfromantik Wertung',
			'short_name' => 'Dorfromantik',
			'description' => 'Wertung und Kampagnen für das Brettspiel Dorfromantik',
			'lang' => 'de',
			'id' => $start,
			'start_url' => $start,
			'scope' => $start,
			'display' => 'standalone',
			'background_color' => '#f7f4ec',
			'theme_color' => '#4f7a3a',
			'icons' => $icons,
		];
		return new DataDisplayResponse(
			json_encode($manifest, JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE),
			200,
			['Content-Type' => 'application/manifest+json; charset=utf-8'],
		);
	}

	#[PublicPage]
	#[NoCSRFRequired]
	public function worker(): DataDisplayResponse {
		$source = file_get_contents($this->apps->getAppPath(Application::APP_ID) . '/pwa/sw.js');
		$response = new DataDisplayResponse($source, 200, [
			'Content-Type' => 'application/javascript; charset=utf-8',
			// Der Worker darf die ganze App abdecken, auch wenn seine Adresse index.php enthält.
			'Service-Worker-Allowed' => $this->urls->linkToRoute('dorfromantik.page.index'),
			'Cache-Control' => 'no-cache',
		]);
		// Die Richtlinie der Antwort gilt im Worker selbst; ohne "connect-src 'self'" dürfte er nichts laden.
		$response->setContentSecurityPolicy(new ContentSecurityPolicy());
		return $response;
	}
}
