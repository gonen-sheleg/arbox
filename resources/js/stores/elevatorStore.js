import { defineStore } from 'pinia';
import { ref } from 'vue';

export const useElevatorStore = defineStore('elevator', () => {
    // State
    const elevators = ref([]);
    const config = ref({
        totalFloors: 10,
        totalElevators: 5,
        speedPerFloor: 1000
    });
    const isConnected = ref(false);
    const animationTimers = ref(new Map());

    // Initialize elevators
    function initialize(elevatorConfig) {
        config.value = elevatorConfig;

        // Create initial elevator state
        elevators.value = Array.from(
            { length: elevatorConfig.totalElevators },
            (_, index) => ({
                id: index + 1,
                currentFloor: 0,
                visualPosition: 0,
                state: 'idle',
                destinationFloor: null
            })
        );

        // Fetch initial state from server
        fetchElevatorState();
    }

    // Fetch current elevator state
    async function fetchElevatorState() {
        try {
            const response = await window.axios.get('/api/elevator/state');

            if (response.data && Array.isArray(response.data)) {
                elevators.value = response.data.map((elevator, index) => ({
                    id: elevator.id || index + 1,
                    currentFloor: elevator.current_floor ?? 0,
                    visualPosition: elevator.current_floor ?? 0,
                    state: elevator.state || 'idle',
                    destinationFloor: elevator.destination_floor
                }));
            }
        } catch (error) {
            console.error('Error fetching elevator state:', error);
        }
    }

    // Update single elevator with animation
    function updateElevator(elevatorData) {
        const index = elevators.value.findIndex(e => e.id === elevatorData.id);

        if (index !== -1) {
            const elevator = elevators.value[index];
            const newFloor = elevatorData.current_floor ?? elevator.currentFloor;
            const oldFloor = elevator.currentFloor;

            // Clear any existing animation for this elevator
            if (animationTimers.value.has(elevatorData.id)) {
                const timer = animationTimers.value.get(elevatorData.id);
                if (timer?.cancel) {
                    timer.cancel();
                } else if (typeof timer === 'number') {
                    clearInterval(timer);
                }
                animationTimers.value.delete(elevatorData.id);
            }

            // Update state immediately
            elevators.value[index] = {
                ...elevator,
                state: elevatorData.state || elevator.state,
                destinationFloor: elevatorData.destination_floor
            };

            // Animate movement if floor changed
            if (newFloor !== oldFloor && elevatorData.state === 'moving') {
                animateElevatorMovement(elevatorData.id, oldFloor, newFloor);
            } else {
                // Update floor immediately if not moving
                elevators.value[index].currentFloor = newFloor;
            }
        }
    }

    // Animate elevator movement between floors with smooth interpolation
    function animateElevatorMovement(elevatorId, fromFloor, toFloor) {
        const index = elevators.value.findIndex(e => e.id === elevatorId);
        if (index === -1) return;

        const totalFloors = Math.abs(toFloor - fromFloor);
        const speedPerFloor = config.value.speedPerFloor;
        const totalDuration = totalFloors * speedPerFloor;
        
        const startTime = Date.now();
        let animationFrameId;

        const animate = () => {
            const elapsed = Date.now() - startTime;
            const progress = Math.min(elapsed / totalDuration, 1);

            // Calculate current position with fractional values for smooth animation
            const currentPosition = fromFloor + (toFloor - fromFloor) * progress;
            
            // Update both visual position and discrete floor
            elevators.value[index].visualPosition = currentPosition;
            elevators.value[index].currentFloor = Math.round(currentPosition);

            // Continue animation if not complete
            if (progress < 1) {
                animationFrameId = requestAnimationFrame(animate);
            } else {
                // Ensure we end at exactly the target floor
                elevators.value[index].visualPosition = toFloor;
                elevators.value[index].currentFloor = toFloor;
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

    // Connect to WebSocket
    function connectToWebSocket() {
        if (!window.Echo) {
            isConnected.value = false;
            return;
        }

        try {
            // Listen to elevator updates channel
            window.Echo.channel('elevator-updates')
                .listen('ElevatorUpdated', (data) => {
                    console.log('Elevator updated:', data);

                    if (data.elevator) {
                        updateElevator(data.elevator);
                    }
                })
                .subscribed(() => {
                    console.log('Successfully subscribed to elevator-updates channel');
                    isConnected.value = true;
                })
                .error((error) => {
                    console.error('WebSocket subscription error:', error);
                    isConnected.value = false;
                });

        } catch (error) {
            console.error('Error connecting to WebSocket:', error);
        }
    }

    // Disconnect from WebSocket
    function disconnect() {
        // Clear all animation timers
        animationTimers.value.forEach(timer => {
            if (timer?.cancel) {
                timer.cancel();
            } else if (typeof timer === 'number') {
                clearInterval(timer);
            }
        });
        animationTimers.value.clear();

        if (window.Echo) {
            window.Echo.leaveChannel('elevator-updates');
            isConnected.value = false;
        }
    }

    // Call elevator to specific floor
    async function callElevator(floor) {
        try {
            const response = await window.axios.post('/api/elevator/call', {
                floor: floor
            });

            // Since backend doesn't implement full logic, simulate elevator selection and movement
            simulateElevatorCall(floor);

            return response.data;
        } catch (error) {
            console.error('Error calling elevator:', error);
            throw error;
        }
    }

    // Simulate elevator selection and movement (client-side)
    function simulateElevatorCall(targetFloor) {
        // Find the closest idle or available elevator
        let bestElevator = null;
        let minDistance = Infinity;

        elevators.value.forEach(elevator => {
            if (elevator.state === 'idle') {
                const distance = Math.abs(elevator.currentFloor - targetFloor);
                if (distance < minDistance) {
                    minDistance = distance;
                    bestElevator = elevator;
                }
            }
        });

        // If no idle elevator, pick the first one
        if (!bestElevator && elevators.value.length > 0) {
            bestElevator = elevators.value[0];
        }

        if (bestElevator) {
            moveElevatorToFloor(bestElevator.id, targetFloor);
        }
    }

    // Move elevator to target floor with animation
    function moveElevatorToFloor(elevatorId, targetFloor) {
        const index = elevators.value.findIndex(e => e.id === elevatorId);
        if (index === -1) return;

        const elevator = elevators.value[index];
        const fromFloor = elevator.currentFloor;

        if (fromFloor === targetFloor) {
            return; // Already at target floor
        }

        // Update to moving state
        elevators.value[index].state = 'moving';
        elevators.value[index].destinationFloor = targetFloor;

        // Start animation
        animateElevatorMovement(elevatorId, fromFloor, targetFloor);

        // Calculate total travel time
        const floorsToTravel = Math.abs(targetFloor - fromFloor);
        const totalTravelTime = floorsToTravel * config.value.speedPerFloor;

        // After reaching destination, set to arrived state
        setTimeout(() => {
            const idx = elevators.value.findIndex(e => e.id === elevatorId);
            if (idx !== -1) {
                elevators.value[idx].state = 'arrived';
                elevators.value[idx].currentFloor = targetFloor;

                // Return to idle after door wait time
                setTimeout(() => {
                    const idxIdle = elevators.value.findIndex(e => e.id === elevatorId);
                    if (idxIdle !== -1) {
                        elevators.value[idxIdle].state = 'idle';
                        elevators.value[idxIdle].destinationFloor = null;
                    }
                }, 2000); // Door wait time
            }
        }, totalTravelTime);
    }

    return {
        // State
        elevators,
        config,
        isConnected,

        // Actions
        initialize,
        fetchElevatorState,
        updateElevator,
        connectToWebSocket,
        disconnect,
        callElevator
    };
});
