<template>
    <div class="relative w-12 h-12 overflow-visible">
        <!-- Elevator Icon positioned based on visualPosition -->
        <div
            v-if="isAnchorCell"
            class="absolute inset-0 flex items-center justify-center pointer-events-none"
            :style="elevatorPositionStyle"
            :class="elevatorColorClass"
        >
            <img
                src="/icons8-elevator.svg"
                alt="Elevator"
                :class="[
                    'w-10 h-10 transition-transform duration-200',
                    elevator.state === 'moving' ? 'scale-110' : 'scale-100'
                ]"
            />
        </div>

        <!-- Timer on floor cell showing time until elevator arrives at destination -->
        <div
            v-if="!isAnchorCell && showFloorTimer"
            class="absolute inset-0 flex items-center justify-center pointer-events-none"
        >
            <div class="bg-blue-500 text-white text-xs font-bold rounded px-6 py-1 whitespace-nowrap">
                {{ formattedTimeToFloor }}
            </div>
        </div>
    </div>
</template>

<script setup>
import { computed, ref, watch, onUnmounted } from 'vue';

const props = defineProps({
    elevator: {
        type: Object,
        required: true
    },
    currentFloor: {
        type: Number,
        required: true
    },
    totalFloors: {
        type: Number,
        required: true
    },
    speedPerFloor: {
        type: Number,
        default: 1000
    }
});

// Check if this is the anchor cell for rendering this elevator
const isAnchorCell = computed(() => {
    // Always anchor to floor 0 to prevent DOM element moving between cells
    return props.currentFloor === 0;
});

// Calculate vertical offset based on visual position
const elevatorPositionStyle = computed(() => {
    const visualPos = props.elevator.visualPosition ?? props.elevator.currentFloor;
    // Calculate offset from floor 0 (the anchor)
    const offset = 0 - visualPos;

    // Convert floor offset to pixels
    // Each floor cell: py-4 (16px top, 16px bottom) + h-12 (48px) = 80px total height
    const pixelOffset = offset * 82;

    return {
        transform: `translateY(${pixelOffset}px)`,
        transition: 'none'
    };
});

// Elevator color based on state
const elevatorColorClass = computed(() => {
    switch (props.elevator.state) {
        case 'idle':
            return 'text-gray-700';
        case 'moving':
            return 'text-yellow-500';
        case 'arrived':
            return 'text-green-500';
        default:
            return 'text-gray-700';
    }
});

// Calculate time to destination (in seconds)
const timeToDestination = computed(() => {
    if (props.elevator.state !== 'moving' || !props.elevator.destinationFloor) {
        return 0;
    }

    const visualPos = props.elevator.visualPosition ?? props.elevator.currentFloor;
    const floorsRemaining = Math.abs(props.elevator.destinationFloor - visualPos);
    const secondsRemaining = Math.ceil((floorsRemaining * props.speedPerFloor) / 1000);

    return secondsRemaining;
});

// Calculate time until elevator reaches this specific floor
const timeToThisFloor = computed(() => {
    if (props.elevator.state !== 'moving' || !props.elevator.destinationFloor) {
        return 0;
    }

    const visualPos = props.elevator.visualPosition ?? props.elevator.currentFloor;
    const destination = props.elevator.destinationFloor;
    const thisFloor = props.currentFloor;

    // Only show timer on destination floor
    if (thisFloor !== destination) {
        return 0;
    }

    const floorsToThisFloor = Math.abs(thisFloor - visualPos);
    const secondsToThisFloor = Math.ceil((floorsToThisFloor * props.speedPerFloor) / 1000);

    return secondsToThisFloor;
});

// Format time as "X min Y sec" or "Y sec"
const formattedTimeToFloor = computed(() => {
    const totalSeconds = timeToThisFloor.value;

    if (totalSeconds === 0) {
        return '';
    }

    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;

    if (minutes > 0) {
        return `${minutes} min ${seconds} sec`;
    }

    return `${seconds} sec`;
});

// Show floor timer only on destination floor and elevator hasn't reached it yet
const showFloorTimer = computed(() => {
    if (props.elevator.state !== 'moving' || !props.elevator.destinationFloor) {
        return false;
    }

    const visualPos = props.elevator.visualPosition ?? props.elevator.currentFloor;
    const destination = props.elevator.destinationFloor;
    const thisFloor = props.currentFloor;

    // Only show on destination floor
    if (thisFloor !== destination) {
        return false;
    }

    // Hide timer when elevator reaches this floor (within 0.1 floors)
    const hasReachedFloor = Math.abs(visualPos - thisFloor) < 0.1;

    return !hasReachedFloor && timeToThisFloor.value > 0;
});
</script>
