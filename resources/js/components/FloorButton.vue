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
import { computed } from 'vue';
import { useElevatorStore } from '../stores/elevatorStore';

const props = defineProps({
    floor: {
        type: Number,
        required: true
    }
});

const store = useElevatorStore();

// Get button state from store
const buttonState = computed(() => 
    store.floorButtonStates.get(props.floor) || 'idle'
);

// Button text based on state
const buttonText = computed(() => {
    switch (buttonState.value) {
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
    switch (buttonState.value) {
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
    buttonState.value === 'waiting' || buttonState.value === 'arrived'
);


// Call elevator function
async function callElevator() {
    if (isDisabled.value) return;

    try {
        // Call elevator through store (store handles state updates)
        await store.callElevator(props.floor);
    } catch (error) {
        console.error('Error calling elevator:', error);
    }
}
</script>
