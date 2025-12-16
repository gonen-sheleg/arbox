<?php

use App\Http\Controllers\ElevatorController;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| API Routes
|--------------------------------------------------------------------------
|
| Here is where you can register API routes for your application. These
| routes are loaded by the RouteServiceProvider and all of them will
| be assigned to the "api" middleware group. Make something great!
|
*/

Route::prefix('elevator')->group(function () {
    // Call an elevator to a specific floor
    Route::post('/call', [ElevatorController::class, 'callElevator']);

    // Get current state of all elevators
    Route::get('/next/{elevator}', [ElevatorController::class, 'getNext']);

    // Reset system to initial state (useful for testing)
    Route::post('/reset', [ElevatorController::class, 'reset']);
});
