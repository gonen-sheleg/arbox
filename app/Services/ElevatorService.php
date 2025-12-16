<?php

namespace App\Services;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Log;

class ElevatorService
{
    private const STATE_KEY = 'elevator:state';
    private const QUEUE_KEY = 'elevator:queue';

    private array $config;

    public function __construct()
    {
        $this->config = config('elevator');
    }

    /**
     * Get the configuration array
     */
    public function getConfig(): array
    {
        return $this->config;
    }

    /**
     * Get current state of all elevators
     */
    public function getElevators(): array
    {
        $elevators = Cache::get(self::STATE_KEY);

        if (!$elevators) {
            $elevators = $this->initializeState();
            $this->setElevators($elevators);
        }

        return $elevators;
    }

    /**
     * Initialize the elevator system with default state
     */
    private function initializeState(): array
    {
        $elevators = [];

        // Parse initial positions if provided
        $initialPositions = config('elevator.initial_positions');

        for ($i = 1; $i <= $this->config['count']; $i++) {
            $elevators[] = [
                'id' => $i,
                'currentFloor' => $initialPositions ?? 0,
                'targetFloor' => null,
                'state' => 'idle',
            ];
        }

        return $elevators;
    }


    private function addQueueCall($floor): void
    {
        $queue = Cache::get(self::QUEUE_KEY,[]);
        $queue[] = $floor;
        Cache::put(self::QUEUE_KEY,$queue);
    }
    /**
     * Call an elevator to a specific floor
     */
    public function callElevator(int $floor): int
    {
        // Validate floor number
        if ($floor < 0 || $floor >= $this->config['floors']) {
            throw new \InvalidArgumentException("Invalid floor number: {$floor}");
        }

        $elevators = $this->getElevators();

        $freeElevators = collect($elevators)->where('state', 'idle')->count();

        Log::info('-------------------------------------');
        Log::info(json_encode($elevators));
        Log::info(json_encode($freeElevators));
        Log::info('-------------------------------------');

        if(empty($freeElevators)){
            $this->addQueueCall($floor);
            return 0;
        }

        // Find closest available elevator
        $closestElevator = $this->findClosestElevator($floor, $elevators);

        $this->updateCatchElevator($closestElevator, $floor);

        return $closestElevator;
    }

    public function updateCatchElevator(int $id, int $floor) : void
    {
        $elevators = $this->getElevators();

        $updateElevators = collect($elevators)
            ->map(fn($elevator) => $elevator['id'] == $id ? [ ...$elevator,'state' => 'moving','targetFloor' => $floor] : $elevator)
            ->toArray();

        $this->setElevators($updateElevators);

    }

    public function releaseAllElevators(array $elevators)
    {
        $updateElevators = collect($elevators)
            ->map(fn($elevator) => [...$elevator,'state' => 'idle'])
            ->toArray();

        $this->setElevators($updateElevators);
    }

    public function releaseElevator(int $id){

        $elevators = $this->getElevators();

        $updateElevators = collect($elevators)
            ->map(fn($elevator) => $elevator['id'] == $id ? [ ...$elevator,'state' => 'idle','currentFloor' => $elevator['targetFloor'], 'targetFloor' => null] : $elevator)
            ->toArray();

        $this->setElevators($updateElevators);
    }


    public function getNextFloor()
    {

        $queue = Cache::get(self::QUEUE_KEY,[]);

        if(empty($queue)){
            return null;
        }

        $nextFloor = array_shift($queue);
        Cache::put(self::QUEUE_KEY,$queue);

        return $nextFloor;
    }

    /**
     * Find the closest idle elevator to the requested floor
     */
    private function findClosestElevator(int $floor, array $elevators): ?int
    {
        $availableElevators = array_filter($elevators, function ($elevator) {
            return $elevator['state'] === 'idle';
        });

        if (empty($availableElevators)) {
            return null;
        }

        // Find elevator with minimum distance
        $closest = null;
        $minDistance = $this->config['floors'];

        foreach ($availableElevators as $id => $elevator) {
            $distance = abs($floor - $elevator['currentFloor']);
            if ($distance < $minDistance) {
                $minDistance = $distance;
                $closest = $elevator;
            }
        }

        return $closest['id'];
    }

    /**
     * Save state to cache
     */
    public function setElevators(array $state): void
    {
        Cache::put(self::STATE_KEY, $state);
    }

    public function resetState()
    {
        Cache::forget(self::STATE_KEY);
        Cache::forget(self::QUEUE_KEY);
        return $this->initializeState();
    }

}
