<?php


return [

    /*
    |--------------------------------------------------------------------------
    | Number of Elevators
    |--------------------------------------------------------------------------
    |
    | Define how many elevators are in the building.
    | This value can be overridden in the .env file using ELEVATOR_COUNT.
    |
    */

    'count' => env('ELEVATOR_COUNT', 5),

    /*
    |--------------------------------------------------------------------------
    | Number of Floors
    |--------------------------------------------------------------------------
    |
    | Define how many floors are in the building (including ground floor).
    | Floor numbering starts at 0 (ground floor).
    | This value can be overridden in the .env file using ELEVATOR_FLOORS.
    |
    */

    'floors' => env('ELEVATOR_FLOORS', 10),

    /*
    |--------------------------------------------------------------------------
    | Elevator Speed Per Floor
    |--------------------------------------------------------------------------
    |
    | Speed in milliseconds it takes for an elevator to travel one floor.
    | Lower value = faster elevator movement.
    | Default: 1000ms (1 second per floor)
    |
    */

    'speed_per_floor' => env('ELEVATOR_FLOOR_TRAVEL_MS', 1000),

    /*
    |--------------------------------------------------------------------------
    | Door Wait Time
    |--------------------------------------------------------------------------
    |
    | Time in milliseconds the elevator waits at a floor before moving
    | to the next destination (simulating door open/close time).
    | Default: 2000ms (2 seconds)
    |
    */

    'door_wait_time' => env('ELEVATOR_DOOR_WAIT', 2000),

    /*
    |--------------------------------------------------------------------------
    | Initial Position
    |--------------------------------------------------------------------------
    |
    | Define the initial floor where all elevators start.
    | If null, all elevators start at ground floor (0).
    | All elevators will begin at this floor number.
    | Example: Setting to 5 places all elevators at the 5th floor
    |
    */

    'initial_positions' => env('ELEVATOR_INITIAL_POSITIONS', null),

];
