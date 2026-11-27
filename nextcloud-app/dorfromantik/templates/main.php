<?php
/**
 * Eigenständige Seite der App (siehe PageController).
 * @var array $_
 */
?><!DOCTYPE html>
<html lang="de">
<head data-requesttoken="<?php p($_['requesttoken']); ?>">
	<meta charset="utf-8">
	<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
	<title>Dorfromantik</title>
	<link rel="manifest" href="<?php p($_['manifestUrl']); ?>">
	<meta name="theme-color" content="#4f7a3a">
	<meta name="mobile-web-app-capable" content="yes">
	<meta name="apple-mobile-web-app-capable" content="yes">
	<meta name="apple-mobile-web-app-status-bar-style" content="default">
	<meta name="apple-mobile-web-app-title" content="Dorfromantik">
	<link rel="apple-touch-icon" href="<?php p($_['iconUrl']); ?>">
	<link rel="icon" type="image/png" href="<?php p($_['iconUrl']); ?>">
	<link rel="stylesheet" href="<?php p($_['styleUrl']); ?>">
</head>
<body>
	<div id="dorfromantik-app"
		data-api-url="<?php p($_['apiUrl']); ?>"
		data-worker-url="<?php p($_['workerUrl']); ?>"
		data-scope="<?php p($_['scope']); ?>"
		data-home-url="<?php p($_['homeUrl']); ?>">
		<p>Wird geladen …</p>
	</div>
	<noscript><p>Für diese App muss JavaScript aktiviert sein.</p></noscript>
	<script type="module" nonce="<?php p($_['cspNonce']); ?>" src="<?php p($_['scriptUrl']); ?>"></script>
</body>
</html>
