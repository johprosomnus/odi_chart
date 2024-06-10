const backendUrl = "https://oxymetrx-test.prosomnus.com";
const superAdminUsername = "ken@sleepon.cn";
const superAdminPassword = "Aa123456";

class User {
  constructor(username, password, name, color) {
    this.username = username;
    this.password = password;
    this.name = name;
    this.color = color;
  }
}

async function loadUserRawData(user, date) {
  try {
    if (!date) {
      return null;
    }
    // Authenticate as super admin and get access token
    const adminLoginResponse = await fetch(
      `${backendUrl}/v1/ad/admin/platform/login?username=${superAdminUsername}&password=${superAdminPassword}`
    );
    const adminLoginData = await adminLoginResponse.json();
    const accessToken = adminLoginData.details.token.access_token;

    // Authenticate as user and get patient ID
    const userLoginResponse = await fetch(
      `${backendUrl}/v1/api/user/login?username=${user.username}&password=${user.password}&type=1`
    );
    const userLoginData = await userLoginResponse.json();
    const patientId = userLoginData.details.user.user_id;

    // Get user data
    const headers = {
      Authorization: `Bearer ${accessToken}`,
    };
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
    userData.data_device_day.local_offset_utc - dayjs().utcOffset() / 60 || 0; // Default offset to 0 if not provided
  let timeArr = [];
  if (userData && userData.data_device_day) {
    let startTime = dayjs(userData.data_device_day.start_time);
    let endTime = dayjs(userData.data_device_day.end_time);

    // Adjust start and end time by the offset
    startTime = startTime.add(offsetHours, "hour");
    endTime = endTime.add(offsetHours, "hour");

    // Calculate the difference in seconds between start and end time
    const diffInSeconds = endTime.diff(startTime, "second");

    // Loop through each second and push formatted time into timeArr
    for (let i = 0; i <= diffInSeconds; i++) {
      const formattedTime = startTime.add(i, "second").toDate();
      timeArr.push(formattedTime);
    }
  }

  return timeArr;
}

function extractOdiData(userData) {
  if (!userData || !userData.data_device_day) {
    return [];
  }

  let offsetHours =
    userData.data_device_day.local_offset_utc - dayjs().utcOffset() / 60 || 0; // Default offset to 0 if not provided
  const odiData = [];
  if (userData.data_odi) {
    userData.data_odi.forEach((odi) => {
      // Adjust ODI start and end times by the offset
      const startTime = dayjs(odi.start_time)
        .add(offsetHours, "hour")
        .format("HH:mm:ss");
      const endTime = dayjs(odi.end_time)
        .add(offsetHours, "hour")
        .format("HH:mm:ss");
      odiData.push({
        startTime,
        endTime,
        value: odi.oxygen_desatu_value,
      });
    });
  }
  return {
    odiData,
    odiIndex: userData.odi_index,
  };
}

async function loadAndDisplayData(date) {
  try {
    // Create users array
    const users = [
      new User(
        "example4",
        "Ps123456",
        "ProSomnus ODI",
        "rgba(255, 173, 177, 0.3)"
      ),
      new User(
        "example6",
        "Ps123456",
        "ProSomnus Float ODI",
        "rgba(224, 66, 245, 0.3)"
      ),
      new User(
        "example2",
        "Ps123456",
        "Golden Standard ODI",
        "rgba(173, 255, 177, 0.3)"
      ),
      new User(
        "example3",
        "Ps123456",
        "SleepON ODI",
        "rgba(177, 173, 255, 0.3)"
      ),
      new User("example1", "Ps123456", "Zephr ODI", "rgba(8, 128, 60, 0.3)"),
    ];

    // Load raw data for each user
    const usersData = await Promise.all(
      users.map((user) => {
        let newDate = date; // Use let to allow reassignment
        const dateMapping = {
          example4: {
            121: "2024-05-09",
            123: "2024-04-16",
            10044: "2024-04-17",
            130: "2024-04-18",
            134: "2024-04-19",
            125: "2024-04-20",
            128: "2024-04-21",
            136: "2024-04-22",
            138: "2024-04-23",
            140: "2024-04-24",
            141: "2024-04-25",
            142: "2024-04-26",
            145: "2024-04-27",
            146: "2024-04-28",
            153: "2024-04-29",
            10024: "2024-04-30",
            10026: "2024-05-01",
            10028: "2024-05-10",
            10030: "2024-05-02",
            10036: "2024-05-11",
            10034: "2024-05-03",
            10045: "2024-05-12",
            10046: "2024-05-04",
            10047: "2024-05-05",
            10048: "2024-05-06",
            10049: "2024-05-07",
            10052: "2024-05-08",
          },
          example6: {
            123: "2024-04-01",
            10044: "2024-04-02",
            130: "2024-04-03",
            134: "2024-04-04",
          },
          example2: {
            121: "2024-04-05",
            123: "2024-04-01",
            10044: "2024-04-02",
            130: "2024-04-03",
            134: "2024-04-04",
            125: "2024-04-06",
            128: "2024-04-07",
            136: "2024-04-08",
            138: "2024-04-09",
            140: "2024-04-10",
            141: "2024-04-11",
            142: "2024-04-12",
            145: "2024-04-13",
            146: "2024-04-14",
            153: "2024-04-15",
            10024: "2024-04-16",
            10026: "2024-04-17",
            10028: "2024-04-18",
            10030: "2024-04-19",
            10034: "2024-04-20",
            10036: "2024-04-21",
            10045: "2024-04-22",
            10046: "2024-04-23",
            10047: "2024-04-24",
            10048: "2024-04-25",
            10049: "2024-04-26",
            10052: "2024-04-27",
          },
          example3: {
            121: "2024-04-24",
            123: "2024-04-01",
            10044: "2024-04-02",
            130: "2024-04-03",
            134: "2024-04-04",
            125: "2024-04-05",
            128: "2024-04-06",
            136: "2024-04-07",
            138: "2024-04-08",
            140: "2024-04-09",
            141: "2024-04-10",
            142: "2024-04-11",
            145: "2024-04-12",
            146: "2024-04-13",
            153: "2024-04-14",
            10024: "2024-04-15",
            10026: "2024-04-16",
            10028: "2024-04-25",
            10030: "2024-04-17",
            10034: "2024-04-18",
            10036: "2024-04-26",
            10045: "2024-04-27",
            10046: "2024-04-19",
            10047: "2024-04-20",
            10048: "2024-04-21",
            10049: "2024-04-22",
            10052: "2024-04-23",
          },
          example1: {
            123: "2024-04-01",
            10044: "2024-04-02",
            130: "2024-04-03",
            134: "2024-04-04",
          },
        };

        if (dateMapping[user.username] && dateMapping[user.username][date]) {
          newDate = dateMapping[user.username][date];
        } else {
          newDate = null;
        }
        return loadUserRawData(user, newDate);
      })
    );

    // Find the user with the longest duration
    let userWithLongestDuration = null;
    let longestDuration = 0;
    for (const userData of usersData) {
      const spo2Data = extractSpO2Data(userData);
      if (spo2Data.length > longestDuration) {
        longestDuration = spo2Data.length;
        userWithLongestDuration = userData;
      }
    }

    if (!userWithLongestDuration) {
      console.error("No user data found.");
      return;
    }

    // Extract SpO2 data for the user with the longest duration
    const spo2Data = extractSpO2Data(userWithLongestDuration);

    // Extract time data for the x-axis
    const timeArr = extractTimeData(userWithLongestDuration);

    // Display the duration
    document.getElementById("duration").textContent = (
      timeArr.length /
      60 /
      60
    ).toFixed(2);

    // Extract ODI data
    const odiData = [];
    for (let i = 0; i < usersData.length; i++) {
      odiData.push(extractOdiData(usersData[i]));
    }

    // Update the content of the table cells with the ODI count values
    for (let i = 0; i < odiData.length; i++) {
      const odiCount = odiData[i].odiData ? odiData[i].odiData.length : 0;
      const odiIndex = odiData[i].odiIndex ? odiData[i].odiIndex : 0;

      if (odiCount === 0) {
        document.getElementById(`odiCount${i + 1}`).textContent = "--";
      } else {
        document.getElementById(`odiCount${i + 1}`).textContent =
          odiCount.toString();
      }
      if (odiIndex === 0) {
        document.getElementById(`odi${i + 1}`).textContent = "--";
      } else {
        document.getElementById(`odi${i + 1}`).textContent =
          odiIndex.toString();
      }
    }

    // Prepare ODI markArea data with different colors for each user
    const odiMarkAreaData = [];
    for (let i = 0; i < odiData.length; i++) {
      if (!odiData[i] || !odiData[i].odiData) {
        console.log(`odiData[${i}] or odiData[${i}].odiData is undefined`);
        odiMarkAreaData.push([]);
      } else {
        odiMarkAreaData.push(
          odiData[i].odiData.map((odi) => [
            {
              xAxis: odi.startTime,
              itemStyle: {
                color: users[i].color,
              },
            },
            {
              xAxis: odi.endTime,
            },
          ])
        );
      }
    }

    // Create an ECharts chart and render SpO2 data with ODI markArea
    const chart = echarts.init(document.getElementById("main"));
    const option = {
      title: {
        text: "SpO2 Data with OD Events",
        top: "3%",
      },
      legend: {
        data: [
          {
            name: "SpO2 Data",
            textStyle: {
              color: "#333",
              textBorderColor: "#000", // Black border
              textBorderWidth: 0.5, // Border width
            },
          },
          ...users.map((user, index) => ({
            name: user.name,
            textStyle: {
              color: user.color,
              textBorderColor: "#000", // Black border
              textBorderWidth: 0.5, // Border width
            },
          })),
        ],
        top: "6%",
      },
      grid: {
        top: "25%",
        bottom: "20%",
      },
      xAxis: {
        type: "category",
        data: timeArr.map((time) => dayjs(time).format("HH:mm:ss")),
      },
      yAxis: {
        type: "value",
        name: "SpO2",
      },
      tooltip: {
        trigger: "axis",
        axisPointer: {
          type: "line",
        },
        formatter: function (params) {
          let html = "";
          params.forEach((param) => {
            if (param.seriesName === "SpO2 Data") {
              html += `Time: ${param.name}<br/>`;
              html += `${param.seriesName}: ${param.value}<br/>`;
            } else {
              html += `Time: ${param.name}<br/>`;
              html += `${param.seriesName}: ${param.data.value}<br/>`;
            }
          });
          return html;
        },
      },
      series: [
        {
          name: "SpO2 Data",
          type: "line",
          smooth: true,
          showSymbol: false,
          data: spo2Data,
        },
        ...users.map((user, index) => ({
          name: user.name,
          type: "bar",
          data: [],
          markArea: {
            silent: true,
            data: odiMarkAreaData[index],
          },
          itemStyle: {
            color: user.color,
          },
        })),
      ],
      dataZoom: [
        {
          type: "slider",
          xAxisIndex: 0,
          top: "15%",
          start: 0,
          end: 100,
          brushSelect: false,
          zoomLock: true,
        },
        {
          type: "inside",
          xAxisIndex: 0,
          zoomOnMouseWheel: false, // Disable zooming on mouse wheel
          moveOnMouseWheel: true, // Enable panning on mouse wheel
        },
      ],
      toolbox: {
        feature: {
          saveAsImage: {},
          dataZoom: { yAxisIndex: "none" },
        },
        top: "10%",
        right: "10%",
      },
    };
    chart.setOption(option);
  } catch (error) {
    console.error("Error fetching users data:", error);
  }
}

// Handle change in the select element
document
  .getElementById("subjectSelector")
  .addEventListener("change", (event) => {
    const date = event.target.value;
    loadAndDisplayData(date);
  });

// Initial load
const initialDate = document.getElementById("subjectSelector").value;
loadAndDisplayData(initialDate);
