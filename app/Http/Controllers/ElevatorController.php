<?php

namespace App\Http\Controllers;

use App\Services\ElevatorService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Validator;

class ElevatorController extends Controller
{
    private ElevatorService $elevatorService;

    public function __construct(ElevatorService $elevatorService)
    {
        $this->elevatorService = $elevatorService;
    }

    /**
     * Show the elevator system view
     */
    public function index()
    {
        $elevators = $this->elevatorService->getElevators();
        $this->elevatorService->releaseAllElevators($elevators);
        $serviceConfig = $this->elevatorService->getConfig();


        $config = [
            'elevators' => $elevators,
            ...$serviceConfig
        ];

        return view('elevators', compact('config'));
    }


    /**
     * Call an elevator to a specific floor
     */
    public function callElevator(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'floor' => [
                'required',
                'integer',
                'min:0',
                'max:' . (config('elevator.floors') - 1),
            ],
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Invalid floor number',
                'errors' => $validator->errors(),
            ], 422);
        }

        try {

            $floor = $request->input('floor');

            $elevator = $this->elevatorService->callElevator($floor);

            return response()->json([
                'success' => true,
                'message' => "Elevator number $elevator is moving to floor $floor",
                'elevatorNumber' => $elevator,
            ]);
        } catch (\Exception $e) {

            return response()->json([
                'success' => false,
                'message' => 'Failed to call elevator',
                'error' => $e->getMessage(),
            ], 500);
        }
    }



    public function getNext($elevator)
    {

        if($elevator < 0 || $elevator > (config('elevator.count'))){
            return response()->json([
                'success' => false,
                'message' => 'Invalid elevator number',
            ], 422);
        }

        $this->elevatorService->releaseElevator($elevator);

        $nextFloor = $this->elevatorService->getNextFloor();

        if(is_null($nextFloor)){
            return response()->json([
                'success' => true,
                'message' => "No more floors to catch",
                'next_floor' => null,
            ]);
        }

        $this->elevatorService->updateCatchElevator($elevator, $nextFloor);


        return response()->json([
            'success' => true,
            'message' => "Next floor for elevator number $elevator is $nextFloor",
            'next_floor' => $nextFloor,
        ]);

    }

    /**
     * Reset the elevator system to initial state
     */
    public function reset(): JsonResponse
    {
        try {
            $state = $this->elevatorService->resetState();

            return response()->json([
                'success' => true,
                'message' => 'Elevator system reset successfully',
                'data' => $state,
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to reset elevator system',
                'error' => $e->getMessage(),
            ], 500);
        }
    }
}
