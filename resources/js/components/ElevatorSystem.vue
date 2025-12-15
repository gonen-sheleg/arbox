<template>
    <div class="min-h-screen bg-gray-100 py-8">
        <!-- Header -->
        <header class="text-center mb-8">
            <h1 class="text-3xl font-bold text-gray-800">
                Elevator Exercise
            </h1>
        </header>

        <!-- Main Container -->
        <main class="max-w-6xl mx-auto">
            <!-- Loop through floors (top to bottom) -->
            <div
                v-for="floor in reversedFloorNumbers"
                :key="floor"
                class="flex items-center"
            >
                <!-- Floor Label (left side - outside grid) -->
                <div class="w-32 text-right font-medium text-gray-700 pr-4">
                    {{ getFloorLabel(floor) }}
                </div>

                <!-- Elevators Grid (middle - white background with grid lines) -->
                <div class="flex bg-white border-y border-l border-gray-300">
                    <div
                        v-for="elevator in elevators"
                        :key="elevator.id"
                        class="flex items-center justify-center px-10 py-4 border-r border-gray-300"
                    >
                        <Elevator
                            :elevator="elevator"
                            :current-floor="floor"
                            :total-floors="config.totalFloors"
                            :speed-per-floor="config.speedPerFloor"
                        />
                    </div>
                </div>

                <!-- Call Button (right side - outside grid) -->
                <div class="w-24 pl-4">
                    <FloorButton :floor="floor" />
                </div>
            </div>
        </main>
    </div>
</template>

<script setup>
import { computed, onMounted, onUnmounted } from 'vue';
import { useElevatorStore } from '../stores/elevatorStore';
import Elevator from './Elevator.vue';
import FloorButton from './FloorButton.vue';

// Get store
const store = useElevatorStore();

// Get elevator config from window
const rawConfig = window.elevatorConfig || {};
const config = {
    totalFloors: rawConfig.totalFloors ?? rawConfig.floors ?? 10,
    totalElevators: rawConfig.totalElevators ?? rawConfig.elevatorCount ?? 5,
    speedPerFloor: rawConfig.speedPerFloor ?? 1000,
};

// Computed properties
const elevators = computed(() => store.elevators);
const floorNumbers = computed(() => {
    const floors = [];
    for (let i = 0; i <= config.totalFloors; i++) {
        floors.push(i);
    }
    return floors;
});

// Reverse order for display (top floor first)
const reversedFloorNumbers = computed(() => {
    return [...floorNumbers.value].reverse();
});

// Floor label helper
function getFloorLabel(floor) {
    if (floor === 0) return 'Ground Floor';
    if (floor === 1) return '1st';
    if (floor === 2) return '2nd';
    if (floor === 3) return '3rd';
    return `${floor}th`;
}

// Initialize on mount
onMounted(() => {
    store.initialize(config);
    store.connectToWebSocket();
});

// Cleanup on unmount
onUnmounted(() => {
    store.disconnect();
});
</script>
