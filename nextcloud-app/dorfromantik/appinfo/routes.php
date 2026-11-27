<?php

declare(strict_types=1);

return [
	'routes' => [
		['name' => 'page#index', 'url' => '/', 'verb' => 'GET'],
		['name' => 'pwa#manifest', 'url' => '/manifest.webmanifest', 'verb' => 'GET'],
		['name' => 'pwa#worker', 'url' => '/sw.js', 'verb' => 'GET'],
		['name' => 'campaign#index', 'url' => '/api/campaigns', 'verb' => 'GET'],
		// Der Platzhalter heißt nicht "id": Sonst würde das Feld "id" im gesendeten JSON ihn überschreiben.
		['name' => 'campaign#save', 'url' => '/api/campaigns/{campaignId}', 'verb' => 'PUT'],
		['name' => 'campaign#destroy', 'url' => '/api/campaigns/{campaignId}', 'verb' => 'DELETE'],
	],
];
