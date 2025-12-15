<template>
    <button
        @click="callElevator"
        :disabled="isDisabled"
        class="w-full px-4 py-2 text-sm font-semibold rounded-md transition-all duration-200 shadow-sm"
        :class="buttonClass"
    >
        {{ buttonText }}
    </button>
</template>

<script setup>
import { ref, computed } from 'vue';
import { useElevatorStore } from '../stores/elevatorStore';

const props = defineProps({
    floor: {
        type: Number,
        required: true
    }
});

const store = useElevatorStore();

// Local state for button
const localState = ref('idle'); // idle, waiting, arrived

// Button text based on state
const buttonText = computed(() => {
    switch (localState.value) {
        case 'waiting':
            return 'Waiting...';
        case 'arrived':
            return 'Arrived!';
        default:
            return 'Call';
    }
});

// Button styling based on state
const buttonClass = computed(() => {
    switch (localState.value) {
        case 'waiting':
            return 'bg-yellow-500 text-white cursor-wait';
        case 'arrived':
            return 'bg-blue-500 text-white';
        default:
            return 'bg-green-500 hover:bg-green-600 text-white cursor-pointer';
    }
});

// Is button disabled
const isDisabled = computed(() =>
    localState.value === 'waiting' || localState.value === 'arrived'
);

// Call elevator function
async function callElevator() {
    if (isDisabled.value) return;

    try {
        localState.value = 'waiting';

        // Call elevator through store (triggers simulation)
        await store.callElevator(props.floor);

        // Watch for elevator arrival at this floor
        watchForArrival();

    } catch (error) {
        console.error('Error calling elevator:', error);
        localState.value = 'idle';
    }
}

// Watch for elevator arrival at this floor
function watchForArrival() {
    const checkInterval = setInterval(() => {
        const arrivedElevator = store.elevators.find(
            elevator => elevator.currentFloor === props.floor && elevator.state === 'arrived'
        );

        if (arrivedElevator) {
            localState.value = 'arrived';
            clearInterval(checkInterval);

            // Reset button after 3 seconds
            setTimeout(() => {
                localState.value = 'idle';
            }, 3000);
        }
    }, 100); // Check every 100ms

    // Timeout after 60 seconds
    setTimeout(() => {
        clearInterval(checkInterval);
        if (localState.value === 'waiting') {
            localState.value = 'idle';
        }
    }, 60000);
}
</script>
