const backendUrl = "https://oxymetrx-test.prosomnus.com";
const superAdminUsername = "ken@sleepon.cn";
const superAdminPassword = "Aa123456";

// Username to patientId mapping
const users = {
  valid1: 387,
  valid2: 389,
  valid3: 390,
  valid4: 391,
  valid5: 392,
  valid6: 393,
  valid8: 395,
  valid9: 396,
  valid10: 397,
  valid11: 398,
  valid12: 399,
  valid13: 400,
  valid14: 401,
  valid15: 402,
  valid16: 403,
  valid17: 404,
  valid18: 405,
  valid19: 406,
  valid20: 407,
  valid21: 408,
  valid22: 409,
  valid23: 410,
  valid24: 411,
  valid25: 412,
  valid26: 413,
  valid27: 414,
};

// Fetch user raw data
async function loadUserRawData(patientId, date) {
  try {
    if (!date) return null;
    const adminLoginResponse = await fetch(
      `${backendUrl}/v1/ad/admin/platform/login?username=${superAdminUsername}&password=${superAdminPassword}`
    );
    const adminLoginData = await adminLoginResponse.json();
    const accessToken = adminLoginData.details.token.access_token;
    const headers = { Authorization: `Bearer ${accessToken}` };
    const userDataResponse = await fetch(
      `${backendUrl}/v1/ad/platform/user/data/${patientId}/${date}`,
      { headers }
    );
    const userData = await userDataResponse.json();
    return userData.details;
  } catch (error) {
    console.error("Error fetching user data:", error);
    throw error;
  }
}

// Function to extract SpO2 data from user data
function extractSpO2Data(userData) {
  const spo2Data = [];
  if (userData && userData.raw && userData.raw.blood_oxygen) {
    userData.raw.blood_oxygen.forEach((spo2) => {
      spo2Data.push(
        ...spo2.data.split(",").map((value) => parseInt(value, 10))
      );
    });
  }
  return spo2Data;
}

function extractTimeData(userData) {
  let offsetHours =
    userData.data_device_day.local_offset_utc - dayjs().utcOffset() / 60 || 0;
  let timeArr = [];
  if (userData && userData.data_device_day) {
    let startTime = dayjs(userData.data_device_day.start_time);
    let endTime = dayjs(userData.data_device_day.end_time);
    startTime = startTime.add(offsetHours, "hour");
    endTime = endTime.add(offsetHours, "hour");
    const diffInSeconds = endTime.diff(startTime, "second");
    for (let i = 0; i <= diffInSeconds; i++) {
      const formattedTime = startTime.add(i, "second").toDate();
      timeArr.push(formattedTime);
    }
  }
  return timeArr;
}

// Extract ODI events as markArea data for ECharts
function extractOdiMarkArea(userData, color) {
  if (!userData || !userData.data_odi) return [];
  let offsetHours =
    userData.data_device_day.local_offset_utc - dayjs().utcOffset() / 60 || 0;
  return userData.data_odi.map((odi) => [
    {
      xAxis: dayjs(odi.start_time).add(offsetHours, "hour").format("HH:mm:ss"),
      itemStyle: { color: color },
    },
    {
      xAxis: dayjs(odi.end_time).add(offsetHours, "hour").format("HH:mm:ss"),
    },
  ]);
}

function extractOdiValues(userData) {

}

async function compareSingleUser(username, dateA, dateB) {
  const patientId = users[username];
  if (!patientId) {
    alert("Invalid username");
    return;
  }
  try {
    const [dataA, dataB] = await Promise.all([
      loadUserRawData(patientId, dateA),
      loadUserRawData(patientId, dateB),
    ]);

    const spo2A = extractSpO2Data(dataA);
    const spo2B = extractSpO2Data(dataB);
    const odiInfoA = {
      count: dataA?.odi_count ?? 'N/A',
      index: dataA?.odi_index ?? 'N/A'
    };

    const odiInfoB = {
      count: dataB?.odi_count ?? 'N/A',
      index: dataB?.odi_index ?? 'N/A'
    };
    const timeArr = dataA ? extractTimeData(dataA) : [];

    // Use blue for Date A, gray for Date B
    const markAreaA = extractOdiMarkArea(dataA, "rgba(100, 149, 237, 0.8)");
    const markAreaB = extractOdiMarkArea(dataB, "rgba(61, 242, 67, 0.8)");

    const chart = echarts.init(document.getElementById("main"));
    chart.setOption({
      title: {
        text: `SpO2 & ODI Comparison for ${username}`,
        top: 10,
        left: 'center',
      },
      tooltip: { trigger: "axis" },
      legend: {
        data: [`${dateA}`, `${dateB}`],
        top: 40,
        left: 'center'
      },
      grid: {
        top: 120,  // Leave enough space for toolbox + dataZoom
        left: 60,
        right: 60,
        bottom: 60
      },
      xAxis: {
        type: "category",
        data: timeArr.map(t => dayjs(t).format("HH:mm:ss")),
        axisLabel: { show: true, interval: 'auto', rotate: 90 }
      },
      yAxis: {
        type: "value",
        name: "SpO2"
      },
      series: [
        {
          name: `${dateA}`,
          type: "line",
          data: spo2A,
          smooth: true,
          showSymbol: false,
          markArea: { silent: true, data: markAreaA },
        },
        {
          name: `${dateB}`,
          type: "line",
          data: spo2B,
          smooth: true,
          showSymbol: false,
          markArea: { silent: true, data: markAreaB },
        },
      ],
      dataZoom: [
        {
          type: "slider",
          xAxisIndex: 0,
          top: 80,              // Move to top below legend
          height: 20,
          start: 0,
          end: 100,
          brushSelect: false,
          zoomLock: true,
        },
        {
          type: "inside",
          xAxisIndex: 0,
          zoomOnMouseWheel: false,
          moveOnMouseWheel: true,
        },
      ],
      toolbox: {
        show: true,
        top: 40,               // Move below title, above dataZoom
        right: 20,
        feature: {
          saveAsImage: {},
          dataZoom: { yAxisIndex: "none" },
        },
      },
    });
    // Set table values
    document.getElementById("odiCountA").textContent = odiInfoA.count;
    document.getElementById("odiCountB").textContent = odiInfoB.count;
    document.getElementById("odiIndexA").textContent = odiInfoA.index;
    document.getElementById("odiIndexB").textContent = odiInfoB.index;

  } catch (error) {
    alert("Failed to load or render chart data.");
    console.error("Error comparing user:", error);
  }
}