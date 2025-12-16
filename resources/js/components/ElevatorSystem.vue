<template>
    <div class="min-h-screen bg-gray-100 flex flex-col items-center justify-center">
        <!-- Header -->
        <header class="text-center mb-8">
            <h1 class="text-3xl font-bold text-gray-800">
                Elevator Exercise
            </h1>
        </header>

        <!-- Main Container -->
        <main class="max-w-6xl">
            <!-- Loop through floors (top to bottom) -->
            <div
                v-for="floor in reversedFloorNumbers"
                :key="floor"
                class="flex items-center"
            >
                <!-- Floor Label (left side - outside grid) -->
                <div class="min-w-[150px] whitespace-nowrap text-right font-medium text-gray-700 pr-8">
                    {{ getFloorLabel(floor) }}
                </div>
                <!-- Elevators Grid (middle - white background with grid lines) -->
                <div class="flex bg-white border-y border-l border-gray-300">
                    <div
                        v-for="elevator in elevators"
                        :key="elevator.id"
                        class="flex items-center justify-center px-8 py-4 border-r border-gray-300"
                    >
                        <Elevator
                            :elevator="elevator"
                            :current-floor="floor"
                            :total-floors="store.config.totalFloors"
                        />
                    </div>
                </div>

                <!-- Call Button (right side - outside grid) -->
                <div class="w-24 pl-4">
                    <FloorButton :floor="floor" />
                </div>
            </div>

            <!-- Reset Button -->
            <div class="flex items-center mt-10">
                <!-- Left spacer to align with floor labels -->
                <div class="w-32"></div>

                <!-- Center button in elevator grid area -->
                <div class="flex justify-center flex-1">
                    <button
                        @click="handleReset"
                        class="px-6 py-3 bg-red-500 hover:bg-red-600 text-white font-semibold rounded-lg shadow-md transition-colors duration-200"
                    >
                        Reset All Elevators
                    </button>
                </div>

                <div>

                </div>

                <!-- Right spacer to align with call buttons -->
                <div class="w-24"></div>
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

// Computed properties
const elevators = computed(() => store.elevators);
const floorNumbers = computed(() => {
    const floors = [];
    for (let i = 0; i < store.config.totalFloors; i++) {
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
    store.initialize();
});

// Reset handler
async function handleReset() {
    try {
        await store.resetSystem();
    } catch (error) {
        console.error('Failed to reset elevator system:', error);
    }
}

</script>
