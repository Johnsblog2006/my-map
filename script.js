document.addEventListener("DOMContentLoaded", function() {
    const prefectures = document.querySelectorAll('.prefecture');
    const buttonsContainer = document.getElementById('selection-buttons');

    adjustMapSizeForDevice(); // ← この行を追加

    let currentPrefecture = null;
    let visitedCount = 0;
    let livedCount = 0;
    const totalPrefectures = 47;

    const prefectureStates = {};

    const chartResize = () => {
        const screenWidth = window.innerWidth;
        const chart = document.getElementById('prefectureChart');
        const barChart = document.getElementById('achievementBarChart');

        if (screenWidth < 768) { // モバイルビュー
            chart.style.maxWidth = "150px";
            barChart.style.maxWidth = "250px";
        } else { // デスクトップまたはタブレットビュー
            chart.style.maxWidth = "214px";
            barChart.style.maxWidth = "300px";
        }
    };

    window.addEventListener('resize', chartResize);
    chartResize(); // ページロード時にも実行

    const ctx = document.getElementById('prefectureChart').getContext('2d');
    let prefectureChart = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: ['Visited', 'Lived', 'Not Yet'],
            datasets: [{
                data: [visitedCount, livedCount, totalPrefectures],
                backgroundColor: ['#71b8ee', '#96e065', '#eeeeee'],
                borderColor: ['#71b8ee', '#96e065', '#cccccc'],
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            plugins: {
                legend: {
                    display: true,
                    position: 'right',
                    align: 'center',
                    labels: {
                        boxWidth: 15,
                        padding: 15,
                        font: {
                            size: 10
                        },
                        usePointStyle: true,
                        pointStyle: 'circle',
                        generateLabels: function(chart) {
                            const datasets = chart.data.datasets;
                            const labels = chart.data.labels;
                            return labels.map((label, i) => {
                                const value = datasets[0].data[i];
                                return {
                                    text: `${label}: ${value}`,
                                    fillStyle: datasets[0].backgroundColor[i],
                                    strokeStyle: datasets[0].borderColor[i],
                                    lineWidth: datasets[0].borderWidth,
                                    hidden: isNaN(datasets[0].data[i]) || datasets[0].data[i] === null,
                                    index: i
                                };
                            });
                        }
                    }
                },
                tooltip: {
                    enabled: true,
                    callbacks: {
                        label: function(tooltipItem) {
                            let value = tooltipItem.raw;
                            let percentage = (value / totalPrefectures * 100).toFixed(2);
                            return `${tooltipItem.label}: ${value} (${percentage}%)`;
                        }
                    }
                }
            },
            layout: {
                padding: 0
            },
            cutout: '70%'
        },
    });

    const barCtx = document.getElementById('achievementBarChart').getContext('2d');
    const achievementBarChart = new Chart(barCtx, {
        type: 'bar',
        data: {
            labels: ['達成率'],
            datasets: [{
                label: '達成率 (%)',
                data: [calculateAchievementRate()],
                borderWidth: 1,
                barThickness: 0 // バーの厚みを固定
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: {
                    beginAtZero: true,
                    max: 100,
                    ticks: {
                        display: false // Y軸の数字を表示しないようにする
                    },
                    grid: {
                        display: false, // Y軸のグリッドラインを非表示にする
                        color: 'transparent' // グリッドラインの色を透明にする
                    }
                },
                x: {
                    ticks: {
                        display: false // X軸の数字も表示しないようにする（必要に応じて）
                    },
                    grid: {
                        display: false, // X軸のグリッドラインを非表示にする
                        color: 'transparent' // グリッドラインの色を透明にする
                    }
                }
            },
            plugins: {
                legend: {
                    display: false
                }
            }
        }
    });

    prefectures.forEach(prefecture => {
        prefectureStates[prefecture.getAttribute('data-code')] = 'not-yet';

        prefecture.addEventListener('click', function(event) {
            currentPrefecture = prefecture;

            const rect = prefecture.getBoundingClientRect();
            const offsetX = rect.width / 2;
            const offsetY = rect.height / 2;

            buttonsContainer.style.top = `${rect.top + offsetY + window.scrollY}px`;
            buttonsContainer.style.left = `${rect.left + offsetX + window.scrollX}px`;

            buttonsContainer.classList.remove('hidden');
            buttonsContainer.classList.add('show');
        });
    });

    function updateCharts() {
        prefectureChart.data.datasets[0].data = [
            visitedCount, 
            livedCount, 
            totalPrefectures - visitedCount - livedCount
        ];
        prefectureChart.update();

        achievementBarChart.data.datasets[0].data = [calculateAchievementRate()];
        achievementBarChart.update();
    }

    function calculateAchievementRate() {
        return parseFloat(((visitedCount + livedCount) / totalPrefectures * 100).toFixed(2));
    }

    function updateCharts() {
        const achievementRate = calculateAchievementRate();

        prefectureChart.data.datasets[0].data = [
            visitedCount, 
            livedCount, 
            totalPrefectures - visitedCount - livedCount
        ];
        prefectureChart.update();

        achievementBarChart.data.datasets[0].data = [achievementRate];
        achievementBarChart.update();

        // Move the train emoji based on achievement rate
        const trainEmoji = document.getElementById('train-emoji');
        const barWidth = document.getElementById('achievementBarChart').clientWidth;
        const emojiPosition = (achievementRate / 100) * barWidth;
        trainEmoji.style.left = `${emojiPosition}px`;

        // パーセンテージを更新
        const percentageElement = document.getElementById('achievement-percentage');
        percentageElement.textContent = `${achievementRate}%`;
    }

    document.getElementById('visited-button').addEventListener('click', function() {
        if (currentPrefecture) {
            updateState(currentPrefecture, 'visited');
        }
    });

    document.getElementById('lived-button').addEventListener('click', function() {
        if (currentPrefecture) {
            updateState(currentPrefecture, 'lived');
        }
    });

    document.getElementById('not-yet-button').addEventListener('click', function() {
        if (currentPrefecture) {
            updateState(currentPrefecture, 'not-yet');
        }
    });

    function saveStateToLocalStorage() {
        localStorage.setItem('prefectureStates', JSON.stringify(prefectureStates));
    }
    
    function loadStateFromLocalStorage() {
        const storedStates = localStorage.getItem('prefectureStates');
        if (storedStates) {
            prefectureStates = JSON.parse(storedStates);
        }
    }
    function updateState(prefecture, newState) {
        const code = prefecture.getAttribute('data-code');
        const currentState = prefectureStates[code];

        if (currentState === newState) {
            return;
        }

        if (currentState === 'visited') visitedCount--;
        if (currentState === 'lived') livedCount--;

        if (newState === 'visited') visitedCount++;
        if (newState === 'lived') livedCount++;

        prefectureStates[code] = newState;

        resetClasses(prefecture);
        if (newState !== 'not-yet') {
            prefecture.classList.add(newState);
        }

        updateCharts();
        hideButtons();

        saveStateToLocalStorage(); // 状態を保存
    }

    document.addEventListener('DOMContentLoaded', function() {
        loadStateFromLocalStorage();
        // ここで、ロードされた状態に応じて都道府県の表示を更新
        for (const code in prefectureStates) {
            const state = prefectureStates[code];
            const prefecture = document.querySelector(`[data-code='${code}']`);
            resetClasses(prefecture);
            if (state !== 'not-yet') {
                prefecture.classList.add(state);
            }
            changeBorderColor(prefecture, state);
        }
        updateCharts(); // チャートも更新
    });

    function resetClasses(element) {
        element.classList.remove('visited', 'lived', 'not-yet');
    }

    function hideButtons() {
        buttonsContainer.classList.remove('show');
        buttonsContainer.classList.add('hidden');
    }
});

function adjustMapSizeForDevice() {
    const mapElement = document.querySelector('.geolonia-svg-map');
    const userAgent = navigator.userAgent.toLowerCase();

    // デバイスごとの条件分岐
    if (/iphone/.test(userAgent)) {
        // iPhone向けのサイズ設定
        mapElement.style.maxWidth = "auto";
        mapElement.style.height = "auto";
    } else if (/ipad/.test(userAgent)) {
        // iPad向けのサイズ設定
        mapElement.style.maxWidth = "auto";
        mapElement.style.height = "auto";
    } else if (/macintosh/.test(userAgent)) {
        // Mac向けのサイズ設定
        mapElement.style.maxWidth = "auto";
        mapElement.style.height = "auto";
    } else {
        // 他のデバイス（デスクトップや不明なデバイスなど）
        mapElement.style.maxWidth = "600px";
        mapElement.style.height = "auto";
    }
}

// ページが読み込まれた際に実行
document.addEventListener("DOMContentLoaded", adjustMapSizeForDevice);
