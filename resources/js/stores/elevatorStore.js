import { defineStore } from 'pinia';
import { ref } from 'vue';


export const useElevatorStore = defineStore('elevator', () => {
    // State
    const elevators = ref([]);
    const config = ref({});
    const isConnected = ref(false);
    const animationTimers = ref(new Map());
    const countdownTimers = ref(new Map());
    const floorButtonStates = ref(new Map()); // Track button states by floor

    // Initialize elevators
    function initialize() {
        const rawConfig = window.elevatorConfig || {};

        // Build config with defaults
        config.value = {
            totalFloors: Number(rawConfig.totalFloors ?? rawConfig.floors ?? 10),
            totalElevators: Number(rawConfig.elevators?.length ?? rawConfig.totalElevators ?? rawConfig.elevatorCount ?? 5),
            speedPerFloor: Number(rawConfig.speed_per_floor ?? 1000),
            doorWaitTime: Number(rawConfig.door_wait_time ?? 2000),
            elevators: rawConfig.elevators || null,
        };


        // Initialize elevators array
        elevators.value = (config.value.elevators || []).map(elevator => ({
            ...elevator,
            visualPosition: elevator.currentFloor,
            timeRemaining: 0
        }));
    }

    // Call elevator to specific floor
    async function callElevator(floor) {
        try {
            console.log('Calling elevator with floor:', floor, 'Type:', typeof floor);

            // Set button state to waiting
            floorButtonStates.value.set(floor, 'waiting');

            const response = await window.axios.post('/api/elevator/call', {
                floor: parseInt(floor, 10)
            });

            const elevatorNumber = response.data.elevatorNumber;

            console.log(floor,'floor')
            console.log(elevatorNumber,'elevatorNumber')
            if (elevatorNumber > 0) {
                moveElevatorToFloor(elevatorNumber, floor);
            }

            return response.data;
        } catch (error) {
            console.error('Error calling elevator:', error);
            if (error.response) {
                console.error('Response status:', error.response.status);
                console.error('Response data:', error.response.data);
            }
            // Reset button state on error
            floorButtonStates.value.set(floor, 'idle');
            throw error;
        }
    }

    // Animate elevator movement between floors with smooth interpolation
    function animateElevatorMovement(elevatorId, fromFloor, toFloor) {
        const totalFloors = Math.abs(toFloor - fromFloor);

        // If already at target floor, no animation needed
        if (totalFloors === 0) {
            return;
        }

        const speedPerFloor = config.value.speedPerFloor || 1000;
        const totalDuration = totalFloors * speedPerFloor;

        const startTime = Date.now();
        let animationFrameId;

        const animate = () => {
            const elevatorIndex = elevators.value.findIndex(e => e.id === elevatorId);
            if (elevatorIndex === -1) return;

            const elapsed = Date.now() - startTime;
            const progress = Math.min(elapsed / totalDuration, 1);

            // Calculate current position with fractional values for smooth animation
            const currentPosition = fromFloor + (toFloor - fromFloor) * progress;

            // Update both visual position and discrete floor
            elevators.value[elevatorIndex].visualPosition = currentPosition;
            elevators.value[elevatorIndex].currentFloor = Math.round(currentPosition);

            // Continue animation if not complete
            if (progress < 1) {
                animationFrameId = requestAnimationFrame(animate);
            } else {
                // Ensure we end at exactly the target floor
                elevators.value[elevatorIndex].visualPosition = toFloor;
                elevators.value[elevatorIndex].currentFloor = toFloor;
                animationTimers.value.delete(elevatorId);
            }
        };

        // Start animation
        animationFrameId = requestAnimationFrame(animate);

        // Store the animation frame ID for cleanup
        animationTimers.value.set(elevatorId, {
            type: 'raf',
            id: animationFrameId,
            cancel: () => cancelAnimationFrame(animationFrameId)
        });
    }

    // Move elevator to target floor with animation
    function moveElevatorToFloor(elevatorId, targetFloor) {


        const elevatorIndex = elevators.value.findIndex(e => e.id === elevatorId);
        if (elevatorIndex === -1) return;

        const elevator = elevators.value[elevatorIndex];

        // Cancel any ongoing animation for this elevator
        const existingAnimation = animationTimers.value.get(elevatorId);
        if (existingAnimation) {
            existingAnimation.cancel();
            animationTimers.value.delete(elevatorId);
        }

        // Cancel any ongoing countdown timer for this elevator
        const existingCountdown = countdownTimers.value.get(elevatorId);
        if (existingCountdown) {
            clearInterval(existingCountdown);
            countdownTimers.value.delete(elevatorId);
        }

        // Initialize visualPosition if not set
        if (elevator.visualPosition === undefined) {
            elevators.value[elevatorIndex].visualPosition = elevator.currentFloor;
        }

        // Update to moving state
        elevators.value[elevatorIndex].state = 'moving';
        elevators.value[elevatorIndex].targetFloor = targetFloor;
        const fromFloor = elevator.visualPosition || elevator.currentFloor

        // Calculate total travel time
        const floorsToTravel = Math.abs(targetFloor - fromFloor);

        const totalTravelTime = floorsToTravel * (config.value.speedPerFloor || 1000);
        console.log('totalTravelTime',totalTravelTime)
        // Set initial timeRemaining in seconds
        elevators.value[elevatorIndex].timeRemaining = Math.ceil(totalTravelTime / 1000);

        // Start countdown timer (updates every second)
        const countdownInterval = setInterval(() => {
            const currentIndex = elevators.value.findIndex(e => e.id === elevatorId);
            if (currentIndex === -1) {
                clearInterval(countdownInterval);
                countdownTimers.value.delete(elevatorId);
                return;
            }

            if (elevators.value[currentIndex].timeRemaining > 0) {
                elevators.value[currentIndex].timeRemaining--;
            } else {
                clearInterval(countdownInterval);
                countdownTimers.value.delete(elevatorId);
            }
        }, 1000);

        countdownTimers.value.set(elevatorId, countdownInterval);

        // Start animation
        animateElevatorMovement(elevatorId, fromFloor, targetFloor);

        // After reaching destination, set to arrived state
        setTimeout(() => {
            const currentIndex = elevators.value.findIndex(e => e.id === elevatorId);
            if (currentIndex === -1) return;

            elevators.value[currentIndex].state = 'arrived';
            elevators.value[currentIndex].currentFloor = targetFloor;
            elevators.value[currentIndex].timeRemaining = 0;

            // Update button state to arrived
            floorButtonStates.value.set(targetFloor, 'arrived');

            // Clear countdown timer
            const countdown = countdownTimers.value.get(elevatorId);
            if (countdown) {
                clearInterval(countdown);
                countdownTimers.value.delete(elevatorId);
            }

            // Return to idle after door wait time
            setTimeout(() => {
                const idleIndex = elevators.value.findIndex(e => e.id === elevatorId);
                if (idleIndex === -1) return;

                elevators.value[idleIndex].state = 'idle';
                elevators.value[idleIndex].targetFloor = null;

                // Reset button state to idle
                floorButtonStates.value.set(targetFloor, 'idle');


            }, config.value.doorWaitTime); // Door wait time

            setTimeout(() => {
                window.axios.get(`/api/elevator/next/${elevatorId}`)
                    .then(response => {
                        const nextFloor = response.data.next_floor;
                        if (nextFloor !== null) {
                            moveElevatorToFloor(elevatorId, nextFloor);
                        }
                    });
            },config.value.doorWaitTime);


        }, totalTravelTime);


    }

    // Reset system - call API and reset all elevators to ground floor without animation
    async function resetSystem() {
        try {
            // Call reset API endpoint
            const response = await window.axios.post('/api/elevator/reset');

            if (response.data.success) {
                // Clear all timers
                animationTimers.value.forEach(timer => timer.cancel());
                animationTimers.value.clear();

                countdownTimers.value.forEach(timer => clearInterval(timer));
                countdownTimers.value.clear();

                // Reset all elevators to ground floor immediately without animation
                elevators.value = elevators.value.map(elevator => ({
                    ...elevator,
                    currentFloor: 0,
                    visualPosition: 0,
                    state: 'idle',
                    targetFloor: null,
                    timeRemaining: 0
                }));

                // Reset all floor button states
                floorButtonStates.value.clear();
            }

            return response.data;
        } catch (error) {
            console.error('Error resetting elevator system:', error);
            throw error;
        }
    }

    return {
        // State
        elevators,
        config,
        isConnected,
        floorButtonStates,

        // Actions
        initialize,
        callElevator,
        resetSystem
    };
});
