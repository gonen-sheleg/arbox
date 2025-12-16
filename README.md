# Arbox Elevator System

A real-time elevator management system built with Laravel 12 and Vue 3, featuring intelligent dispatching algorithms, smooth animations, and Redis-based state management.

**Time Investment:** 10 hours

## Features

- 🏢 Multi-elevator system with configurable elevator count
- 🎯 Smart dispatching (assigns closest idle elevator)
- 📊 Queue management for high-demand scenarios
- ⚡ Redis-based state management for performance
- 🎨 Real-time visual animations with smooth transitions
- 🔔 Audio feedback on elevator arrival
- ⏱️ Live countdown timers showing arrival time
- 🔄 Automatic queue processing when elevators become idle
- 🎛️ Configurable floors, speed, and door wait times
- 🧪 Built-in system reset functionality

## What's Included

This repository contains a complete, production-ready elevator simulation with:

- ✅ **Full source code** with organized service layer architecture
- ✅ **API endpoints** for elevator operations (call, next, reset)
- ✅ **Vue 3 frontend** with Pinia state management
- ✅ **Smooth animations** using requestAnimationFrame
- ✅ **Redis integration** for fast state persistence
- ✅ **Docker configuration** via Laravel Sail for easy local setup
- ✅ **Configurable system** with environment variables
- ✅ **Interactive UI** with Tailwind CSS styling

## Architecture Decisions

### Why Redis for State Management?

The elevator system uses Redis (via Laravel Cache) for storing elevator state instead of a traditional database:

1. **Speed**: Sub-millisecond read/write operations essential for real-time updates
2. **Atomic operations**: Redis ensures consistent state updates across concurrent requests
3. **Simplicity**: In-memory key-value storage perfect for ephemeral state that doesn't need persistence
4. **Scalability**: Easy to scale horizontally with Redis Cluster if needed

**State keys**: `elevator:state` (current positions/status) and `elevator:queue` (pending floor requests)

### Why Queue for Pending Calls?

When all elevators are busy, incoming floor requests are queued and processed automatically:

1. **Fair ordering**: FIFO queue ensures requests are served in order
2. **No lost requests**: All calls are guaranteed to be served eventually
3. **Automatic processing**: When an elevator becomes idle after delivering passengers, it automatically picks up the next queued request
4. **Decoupling**: Separates request acceptance from request fulfillment

**Flow**: Request → Check Idle Elevators → If None → Queue → Process When Available

### Why Closest Elevator Algorithm?

The system assigns the closest idle elevator to minimize wait time:

1. **Efficiency**: Reduces average wait time across all passengers
2. **Energy savings**: Minimizes total distance traveled by elevators
3. **User satisfaction**: Faster response times improve perceived performance
4. **Simple implementation**: Distance calculation based on floor difference

### Why Vue 3 + Pinia for Frontend?

Modern reactive frontend stack for smooth real-time updates:

1. **Reactivity**: Pinia store automatically updates UI when elevator state changes
2. **Smooth animations**: requestAnimationFrame provides 60fps smooth movement
3. **Component architecture**: Reusable Elevator, FloorButton, and ElevatorSystem components
4. **State centralization**: Single source of truth in Pinia store

## Requirements

- **Docker Desktop** (includes Docker Compose)
  - [Download for Mac](https://docs.docker.com/desktop/install/mac-install/)
  - [Download for Windows](https://docs.docker.com/desktop/install/windows-install/)
  - [Download for Linux](https://docs.docker.com/desktop/install/linux-install/)
- **Git**

> **Note**: No need to install PHP, Composer, Node.js, or Redis locally. Everything runs inside Docker containers via Laravel Sail.

## Installation & Running

### Quick Start

```bash
git clone https://github.com/gonen-sheleg/arbox.git
cd arbox
cp .env.example .env
./vendor/bin/sail up -d
./vendor/bin/sail composer install
./vendor/bin/sail npm install
./vendor/bin/sail npm run build
./vendor/bin/sail artisan key:generate
```

Then visit: http://localhost/elevators

## Detailed Installation Guide

### Step 1: Clone and Setup Environment

```bash
git clone https://github.com/gonen-sheleg/arbox.git
cd arbox
cp .env.example .env
```

### Step 2: Start Docker Containers

```bash
./vendor/bin/sail up -d
```

This starts Redis and the Laravel app containers. First-time setup may take 5-10 minutes to download Docker images.

**Optional**: Create a shell alias for convenience:

```bash
alias sail='./vendor/bin/sail'
```

### Step 3: Install Dependencies

```bash
sail composer install
sail npm install
sail artisan key:generate
```

### Step 4: Build Frontend Assets

```bash
sail npm run build
```

For development with hot-reload:

```bash
sail npm run dev
```

### Step 5: Access the Application

- 🏠 **Main interface**: http://localhost/elevators
- 🔄 **Auto-redirect**: http://localhost → http://localhost/elevators

## Configuration

All elevator system parameters can be customized via environment variables in `.env`:

```bash
# Number of elevators (default: 5)
ELEVATOR_COUNT=5

# Number of floors including ground floor (default: 10)
# Floor numbering: 0 (ground) to ELEVATOR_FLOORS-1
ELEVATOR_FLOORS=10

# Speed in milliseconds per floor (default: 1000ms = 1 second per floor)
ELEVATOR_SPEED=1000

# Door wait time in milliseconds (default: 2000ms = 2 seconds)
ELEVATOR_DOOR_WAIT=2000

# Initial positions of elevators (default: all start at ground floor)
# Format: comma-separated floor numbers, e.g., "0,2,4,6,8"
ELEVATOR_INITIAL_POSITIONS=0
```

**After changing configuration**, restart the application:

```bash
sail artisan config:clear
sail up -d
```

## API Usage Examples

The API provides RESTful endpoints for programmatic elevator control.

### Call an Elevator

```bash
# Call elevator to floor 5
curl -X POST http://localhost/api/elevator/call \
  -H "Content-Type: application/json" \
  -d '{"floor": 5}'

# Response (elevator assigned):
# {
#   "success": true,
#   "message": "Elevator number 3 is moving to floor 5",
#   "elevatorNumber": 3
# }

# Response (all elevators busy - queued):
# {
#   "success": true,
#   "message": "Elevator number 0 is moving to floor 5",
#   "elevatorNumber": 0
# }
```

**Validation**: Floor must be between 0 and ELEVATOR_FLOORS-1

### Get Next Queued Floor

```bash
# Get next floor for elevator 2 after it completes current trip
curl -X GET http://localhost/api/elevator/next/2

# Response (has queued request):
# {
#   "success": true,
#   "message": "Next floor for elevator number 2 is 7",
#   "next_floor": 7
# }

# Response (queue empty):
# {
#   "success": true,
#   "message": "No more floors to catch",
#   "next_floor": null
# }
```

**Note**: This endpoint is called automatically by the frontend when an elevator becomes idle.

### Reset System

```bash
# Reset all elevators to ground floor and clear queue
curl -X POST http://localhost/api/elevator/reset

# Response:
# {
#   "success": true,
#   "message": "Elevator system reset successfully",
#   "data": [
#     {
#       "id": 1,
#       "currentFloor": 0,
#       "targetFloor": null,
#       "state": "idle"
#     },
#     ...
#   ]
# }
```

## How It Works

### Elevator States

Each elevator can be in one of three states:

- **`idle`**: Waiting at a floor, available for assignment (black icon)
- **`moving`**: Traveling to target floor (red icon with animation)
- **`arrived`**: Reached destination, doors open (green icon)

### Call Flow

1. **User clicks "Call" button** on a floor
2. **Button state changes to "Waiting"** (red)
3. **Backend finds closest idle elevator**
   - If available: Assigns and responds with elevator number
   - If all busy: Adds to queue, responds with elevatorNumber=0
4. **Frontend animates elevator movement**
   - Smooth transition using requestAnimationFrame
   - Live countdown timer shows ETA on destination floor
5. **Elevator arrives** (state: `arrived`)
   - Button changes to "Arrived" (green)
   - Bell sound plays
6. **Doors close after wait time** (state: `idle`)
   - Button resets to "Call"
   - Backend checks queue for next request
   - If queued request exists, automatically dispatches elevator

### Queue Processing

- **FIFO order**: First call gets first elevator
- **Automatic**: No manual intervention needed
- **Transparent**: Frontend shows "Waiting" state for queued calls
- **Persistent**: Queue stored in Redis survives brief disconnections

## User Interface

### Visual Elements

- **Floor Labels**: Ground Floor, 1st, 2nd, 3rd, 4th, etc.
- **Elevator Icons**: SVG elevator symbols colored by state
- **Call Buttons**: Per-floor buttons with state-based styling
- **Countdown Timers**: Show "X sec" or "X min Y sec" until arrival
- **Reset Button**: Red button to reset entire system

### Button States

- **Call** (green): Available to request elevator
- **Waiting** (red): Request queued, elevator dispatched or pending
- **Arrived** (green outline): Elevator at floor, doors open
- **Disabled**: When elevator already idle at that floor

### Animations

- **Smooth movement**: Elevators glide between floors (not jerky)
- **Scale effect**: Moving elevators slightly enlarged
- **Color transitions**: State changes smoothly animated
- **Timer countdown**: Updates every second

## Project Structure

```
arbox/
├── app/
│   ├── Http/
│   │   └── Controllers/
│   │       └── ElevatorController.php    # API endpoints
│   └── Services/
│       └── ElevatorService.php           # Business logic
├── config/
│   └── elevator.php                      # System configuration
├── resources/
│   ├── js/
│   │   ├── components/
│   │   │   ├── ElevatorSystem.vue       # Main layout
│   │   │   ├── Elevator.vue             # Single elevator display
│   │   │   └── FloorButton.vue          # Call button per floor
│   │   └── stores/
│   │       └── elevatorStore.js         # Pinia state management
│   └── views/
│       └── elevators.blade.php          # Entry point
├── routes/
│   ├── web.php                          # Web routes
│   └── api.php                          # API routes
├── public/
│   ├── elevator-bell.wav                # Arrival sound
│   └── icons8-elevator.svg              # Elevator icon
└── compose.yaml                         # Docker configuration
```

## Tech Stack

- **Framework**: Laravel 12 (PHP 8.2+)
- **Cache/State**: Redis (via Predis client)
- **Frontend**: Vue 3 with Composition API
- **State Management**: Pinia
- **Styling**: Tailwind CSS
- **Build Tool**: Vite
- **Container**: Docker (Laravel Sail)
- **Testing**: Pest (PHPUnit wrapper)

## Development Tips

### Watching Frontend Changes

```bash
# Run Vite dev server for hot-reload
sail npm run dev
```

Leave this running in a separate terminal while developing Vue components.

### Checking Redis State

```bash
# Access Redis CLI
sail redis redis-cli

# View current elevator state
GET elevator:state

# View current queue
GET elevator:queue

# Clear all data
FLUSHDB
```

### Debugging

```bash
# View Laravel logs
sail artisan pail

# View container logs
sail logs -f

# Check running containers
sail ps
```

### Code Quality

```bash
# Run PHP linter
sail composer pint

# Run tests (when added)
sail artisan test
```

## Troubleshooting

### Elevators Not Moving

- Check browser console for JavaScript errors
- Verify Redis is running: `sail redis redis-cli ping` (should return PONG)
- Clear Redis cache: `sail artisan cache:clear`

### API Errors

- Ensure `.env` has valid configuration
- Check floor number is within valid range (0 to ELEVATOR_FLOORS-1)
- Verify containers are running: `sail ps`

### Frontend Not Loading

- Rebuild assets: `sail npm run build`
- Clear browser cache (Ctrl+Shift+R or Cmd+Shift+R)
- Check Vite is running: `sail npm run dev`

## Future Enhancements

- 📊 Add statistics dashboard (trips per elevator, average wait time)
- 🧪 Comprehensive Pest test suite
- 🔄 WebSocket integration for real-time multi-client sync
- 🎮 More advanced algorithms (SCAN, LOOK, elevator grouping)
- 📱 Responsive mobile design
- 🌐 Multi-building support
- 📈 Performance metrics and monitoring

## License

MIT License - feel free to use for learning and interviews.
