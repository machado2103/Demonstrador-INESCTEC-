// renderer.js
document.addEventListener('DOMContentLoaded', () => {
    const connectionStatus = document.getElementById('connection-status');
    const statusDot = connectionStatus.querySelector('.status-dot');
    const statusText = connectionStatus.querySelector('.status-text');
    const backendStatus = document.getElementById('backend-status');
    const systemData = document.getElementById('system-data');

    // Button elements
    const connectAmrBtn = document.getElementById('connect-amr');
    const connectArmBtn = document.getElementById('connect-arm');
    const startSimulationBtn = document.getElementById('start-simulation');
    const startRosBtn = document.getElementById('start-ros');
    const emergencyStopBtn = document.getElementById('emergency-stop');

    // Status elements
    const amrStatus = document.getElementById('amr-status');
    const armStatus = document.getElementById('arm-status');
    const simulationStatus = document.getElementById('simulation-status');
    const rosStatus = document.getElementById('ros-status');

    // Check backend status
    async function checkBackendStatus() {
        try {
            const result = await window.api.request({
                method: 'GET',
                endpoint: '/status'
            });
            
            if (result && result.msg) {
                backendStatus.textContent = `Backend Status: ${result.msg}`;
                statusDot.classList.add('connected');
                statusText.textContent = 'Connected to backend';
                return true;
            }
            return false;
        } catch (error) {
            console.error('Error checking backend status:', error);
            backendStatus.textContent = 'Error connecting to backend';
            statusDot.classList.add('error');
            statusText.textContent = 'Backend connection error';
            return false;
        }
    }

    // Update system data
    function updateSystemData(data) {
        if (!data) {
            systemData.innerHTML = '<p>No data available</p>';
            return;
        }
        
        let html = '<div class="system-info">';
        
        if (data.amr) {
            html += `
                <h3>AMR Robot Data</h3>
                <p>Status: ${data.amr.status}</p>
                <p>Battery: ${data.amr.battery}%</p>
                <p>Position: X: ${data.amr.position.x}, Y: ${data.amr.position.y}</p>
            `;
        }
        
        if (data.arm) {
            html += `
                <h3>Robotic Arm Data</h3>
                <p>Status: ${data.arm.status}</p>
                <p>Current Job: ${data.arm.currentJob || 'None'}</p>
                <p>Position: ${JSON.stringify(data.arm.position)}</p>
            `;
        }
        
        if (data.simulation) {
            html += `
                <h3>Simulation Data</h3>
                <p>Status: ${data.simulation.status}</p>
                <p>FPS: ${data.simulation.fps}</p>
            `;
        }
        
        if (data.ros) {
            html += `
                <h3>ROS Data</h3>
                <p>Status: ${data.ros.status}</p>
                <p>Connected Topics: ${data.ros.topics.join(', ')}</p>
            `;
        }
        
        html += '</div>';
        systemData.innerHTML = html;
    }

    // Connect to AMR
    connectAmrBtn.addEventListener('click', async () => {
        try {
            const result = await window.api.request({
                method: 'POST',
                endpoint: '/connect/amr',
                data: { ip: '192.168.1.100' } // Example IP, this would be configurable
            });
            
            if (result && result.success) {
                amrStatus.textContent = 'Connected';
                amrStatus.classList.add('connected');
                connectAmrBtn.textContent = 'Disconnect AMR';
                
                // Update data display
                updateSystemData(result.data);
            } else {
                amrStatus.textContent = 'Connection Failed';
                amrStatus.classList.add('error');
            }
        } catch (error) {
            console.error('Error connecting to AMR:', error);
            amrStatus.textContent = 'Connection Error';
            amrStatus.classList.add('error');
        }
    });

    // Connect to Robotic Arm
    connectArmBtn.addEventListener('click', async () => {
        try {
            const result = await window.api.request({
                method: 'POST',
                endpoint: '/connect/arm',
                data: { port: 'COM3' } // Example port, this would be configurable
            });
            
            if (result && result.success) {
                armStatus.textContent = 'Connected';
                armStatus.classList.add('connected');
                connectArmBtn.textContent = 'Disconnect Arm';
                
                // Update data display
                updateSystemData(result.data);
            } else {
                armStatus.textContent = 'Connection Failed';
                armStatus.classList.add('error');
            }
        } catch (error) {
            console.error('Error connecting to robotic arm:', error);
            armStatus.textContent = 'Connection Error';
            armStatus.classList.add('error');
        }
    });

    // Start Simulation
    startSimulationBtn.addEventListener('click', async () => {
        try {
            const result = await window.api.request({
                method: 'POST',
                endpoint: '/simulation/start',
            });
            
            if (result && result.success) {
                simulationStatus.textContent = 'Active';
                simulationStatus.classList.add('connected');
                startSimulationBtn.textContent = 'Stop Simulation';
                
                // If there's a video stream, show it
                if (result.videoUrl) {
                    document.getElementById('placeholder-video').style.display = 'none';
                    const video = document.getElementById('simulation-video');
                    video.src = result.videoUrl;
                    video.style.display = 'block';
                    video.play();
                }
                
                // Update data display
                updateSystemData(result.data);
            } else {
                simulationStatus.textContent = 'Start Failed';
                simulationStatus.classList.add('error');
            }
        } catch (error) {
            console.error('Error starting simulation:', error);
            simulationStatus.textContent = 'Start Error';
            simulationStatus.classList.add('error');
        }
    });

    // Connect to ROS
    startRosBtn.addEventListener('click', async () => {
        try {
            const result = await window.api.request({
                method: 'POST',
                endpoint: '/connect/ros',
                data: { url: 'ws://localhost:9090' } // Example WebSocket URL
            });
            
            if (result && result.success) {
                rosStatus.textContent = 'Connected';
                rosStatus.classList.add('connected');
                startRosBtn.textContent = 'Disconnect ROS';
                
                // Update data display
                updateSystemData(result.data);
            } else {
                rosStatus.textContent = 'Connection Failed';
                rosStatus.classList.add('error');
            }
        } catch (error) {
            console.error('Error connecting to ROS:', error);
            rosStatus.textContent = 'Connection Error';
            rosStatus.classList.add('error');
        }
    });

    // Emergency Stop
    emergencyStopBtn.addEventListener('click', async () => {
        try {
            const result = await window.api.request({
                method: 'POST',
                endpoint: '/emergency/stop',
            });
            
            if (result && result.success) {
                // Add red border to emergency button to indicate it's activated
                emergencyStopBtn.classList.add('activated');
                
                // Set all statuses to "EMERGENCY STOP"
                amrStatus.textContent = 'EMERGENCY STOP';
                armStatus.textContent = 'EMERGENCY STOP';
                simulationStatus.textContent = 'EMERGENCY STOP';
                rosStatus.textContent = 'EMERGENCY STOP';
                
                // Add error class to all statuses
                [amrStatus, armStatus, simulationStatus, rosStatus].forEach(status => {
                    status.className = 'value error';
                });
                
                // Alert the user
                alert('EMERGENCY STOP ACTIVATED!');
            }
        } catch (error) {
            console.error('Error during emergency stop:', error);
            alert('EMERGENCY STOP FAILED! Check system immediately!');
        }
    });

    // Poll backend status periodically
    async function pollBackendStatus() {
        const isConnected = await checkBackendStatus();
        
        if (isConnected) {
            // Poll for system data
            try {
                const systemDataResult = await window.api.request({
                    method: 'GET',
                    endpoint: '/system/data'
                });
                
                if (systemDataResult) {
                    updateSystemData(systemDataResult);
                }
            } catch (error) {
                console.error('Error fetching system data:', error);
            }
        }
        
        // Poll every 5 seconds
        setTimeout(pollBackendStatus, 5000);
    }

    // Start polling
    pollBackendStatus();
});