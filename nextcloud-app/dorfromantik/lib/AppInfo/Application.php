<?php

declare(strict_types=1);

namespace OCA\Dorfromantik\AppInfo;

use OCP\AppFramework\App;

class Application extends App {
	public const APP_ID = 'dorfromantik';

	public function __construct(array $urlParams = []) {
		parent::__construct(self::APP_ID, $urlParams);
	}
}
