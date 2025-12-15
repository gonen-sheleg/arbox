<!DOCTYPE html>
<html lang="{{ str_replace('_', '-', app()->getLocale()) }}" dir="ltr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta name="csrf-token" content="{{ csrf_token() }}">

    <title>{{ config('app.name', 'Elevator System') }}</title>

<!-- Inject Elevator Configuration to JavaScript -->
<script>
    window.elevatorConfig = @json($config);
</script>

<!-- Vite Assets -->
@vite(['resources/css/app.css', 'resources/js/app.js'])
</head>
<body class="antialiased">
<!-- Vue Application Mount Point -->
<div id="app"></div>
</body>
</html>
