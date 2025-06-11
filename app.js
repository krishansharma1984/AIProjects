
const routes = [
    { path: '/employee-hub', component: EmployeeHub },
    { path: '/contracts-request', component: ContractsRequest },
    { path: '/suppliers-creation', component: SuppliersCreation },
    { path: '/request-access-card', component: AccessCardRequest },
    { path: '/access-card-form', component: AccessCardRequest },
    { path: '/setup-workstation', component: ITRequisition },
    { path: '/create-ad-profile', component: SecurityClearanceRequest },
    { path: '/schedule-induction', component: Induction },
    { path: '/card-cash-request', component: CardCashRequest },
    { path: '/leave-tracking', component: LeaveTracking },
    { path: '/e-ticket', component: ETicket },
    { path: '/visa-request', component: VisaRequest },
    { path: '/life-insurance', component: LifeInsurance },
    { path: '/assign-manager', component: AssignManager },
];

const router = new VueRouter({ routes });


const app = new Vue({
    el: '#app',
    router,
    data: {
        routeClicked: false,
        form: {
            supplierName: "",
            contractTitle: "",
            type: "",
            department: "",
            startDate: "",
            endDate: "",
            value: null,
            paymentTerms: "",
            email: "",
            risk: "",
            stakeholders: "",
            justification: "",
        },
        chatModalVisible: false,
        chatWidgetVisible: false,
        chatPosition: false,
        chatMessages: [
            { sender: "ai", text: "<em>Upload a document or describe the request to auto-populate.</em>" },
            { sender: "ai", text: "<em>How can I help you today?</em>" },
        ],
        chatInput: "",
        loading: false,
        recognition: null,
        voiceText: "",
        isDictating: false,
        chatBoxHTML: '',
        isBottomChatClicked: false,
        API_KEY: "MyKrishanAPIKeyWithComplexNameWithNoBodyGuessOnPlanetEarthIncludingMars"
    },
    methods: {
        toggleChat(isBottomClicked = false) {
            this.isBottomChatClicked = isBottomClicked
            const widget = document.getElementById("chatWidget");
            widget.style.display = widget.style.display === "flex" ? "none" : "flex";

            /* if(widget.style.display === "flex"){
              widget.classList.remove("chat-box");
            }
            else{
              widget.classList.add("chat-box");
            } */

            const modal = document.getElementById("chatModal");
            modal.style.display = modal.style.display === "flex" ? "none" : "flex";

            if (isBottomClicked) {
                widget.classList.add("chat-position");
                /* modal.style.width='100%'
                modal.style.height='100%' */
            }
            else {
                widget.classList.remove("chat-position");
                /* modal.style.width='0%'
                modal.style.height='0%' */
            }

        },

        showLoader() {
            document.getElementById("loaderOverlay").style.display = "flex";
        },
        hideLoader() {
            setTimeout(() => {
                document.getElementById("loaderOverlay").style.display = "none";
            }, 200);

        },

        openChatModal() {
            this.toggleChat()
            document.getElementById("chatModal").style.display = "flex";
        },

        closeChatModal() {
            this.toggleChat()
            document.getElementById("chatModal").style.display = "none";

        },

        appendToChat(message, sender = "user") {
            /*  const chatbox = document.getElementById("chatbox");
             const msg = document.createElement("div");
             msg.innerHTML = `<strong>${sender === "user" ? 'You' : 'AI'}:</strong> ${message}`;
             chatbox.appendChild(msg);
             chatbox.scrollTop = chatbox.scrollHeight; */

            this.chatBoxHTML += `<div><strong>${sender === "user" ? 'You' : 'AI'}:</strong> ${message}</div>`;
        },

        async handleChatSubmit() {
            this.voiceText = ""
            const input = this.chatInput?.trim() //document.getElementById("chatInput").value.trim();
            if (input) {
                this.showLoader()
                this.appendToChat(input, "user");
                if (this.isBottomChatClicked) {
                    await this.callAzureAIHTML(input)
                }
                else {
                    await this.callAzureAI({ text: input });
                }

                this.chatInput = ""
                //document.getElementById("chatInput").value = "";
                this.hideLoader()
            }
        },

        async handleFileUpload() {
            const file = document.getElementById("fileInput").files[0];
            if (file) {
                this.showLoader()
                this.appendToChat(`Uploaded file: ${file.name}`, "user");
                await this.callAzureAI({ file });
                this.hideLoader()
            }
        },



        startVoiceDictation() {
            this.recognition = new (window.SpeechRecognition || window.webkitSpeechRecognition)();
            this.recognition.lang = 'en-US';
            this.recognition.continuous = true; // Keep listening even with pauses
            this.recognition.interimResults = false;

            //document.getElementById("voiceLoader").style.display = "block"; // Show loader

            // Toggle icons
            document.getElementById("micIcon").style.display = "none";
            const stopIcon = document.getElementById("stopIcon");
            stopIcon.style.display = "inline";
            stopIcon.classList.add("blinking");

            this.recognition.onresult = function (event) {
                const transcript = Array.from(event.results)
                    .map(result => result[0].transcript)
                    .join(" ");
                this.voiceText = !!this.voiceText ? (this.voiceText + " " + transcript) : transcript
                //document.getElementById("chatInput").value = this.voiceText;
                this.chatInput = this.voiceText;
                //appendToChat(transcript, "user");
                //await callAzureAI({ text: transcript });
                //document.getElementById("voiceLoader").style.display = "none"; // Hide loader
            };
            this.recognition.onerror = function (event) {
                //document.getElementById("voiceLoader").style.display = "none"; // Hide loader
                alert("Voice error: " + event.error);

            };
            this.recognition.onend = function () {
                //document.getElementById("voiceLoader").style.display = "none"; // Hide loader if user stops
            };
            this.recognition.start();
        },

        stopVoiceDictation() {
            if (this.recognition) {
                this.recognition.stop();
            }
            //document.getElementById("voiceLoader").style.display = "none";

            // Toggle icons back
            document.getElementById("micIcon").style.display = "inline";
            const stopIcon = document.getElementById("stopIcon");
            stopIcon.style.display = "none";
            stopIcon.classList.remove("blinking");
        },

        async callAzureAI({ text = null, file = null }) {

            this.appendToChat("Analyzing your input...", "AI");

            const apiKey = this.API_KEY
            const baseUrl = "https://documentparserapi20250524115701-b8ereadadvfebmfs.canadacentral-01.azurewebsites.net/api/document";

            try {
                let response, data;

                if (file) {
                    let endpoint = "";
                    if (file.type === "application/pdf") {
                        endpoint = "/parse-pdf";
                    } else if (file.type.startsWith("audio/")) {
                        endpoint = "/parse-audio";
                    } else if (file.type === "text/plain" || file.name.endsWith(".txt")) {
                        // Read text content from the file
                        const textContent = await file.text();
                        response = await fetch(baseUrl + "/parse-text", {
                            method: "POST",
                            headers: {
                                "Content-Type": "application/json",
                                "x-api-key": apiKey
                            },
                            body: JSON.stringify({ text: textContent })
                        });
                        data = await response.json();
                        this.fillForm(data);
                        this.appendToChat("Form updated with extracted details from text file.", "AI");
                        return;
                    } else {
                        this.appendToChat("Unsupported file type.", "AI");
                        return;
                    }

                    const formData = new FormData();
                    if (endpoint === "/parse-pdf") {
                        formData.append("pdfFile", file);
                    } else if (endpoint === "/parse-audio") {
                        formData.append("audioFile", file);
                    }

                    response = await fetch(baseUrl + endpoint, {
                        method: "POST",
                        headers: {
                            "x-api-key": apiKey
                        },
                        body: formData
                    });

                    data = await response.json();
                    this.fillForm(data);
                    this.appendToChat("Form updated with extracted details from uploaded file.", "AI");

                } else if (text) {
                    response = await fetch(baseUrl + "/parse-text", {
                        method: "POST",
                        headers: {
                            "Content-Type": "application/json",
                            "x-api-key": apiKey
                        },
                        body: JSON.stringify({ text })
                    });
                    data = await response.json();
                    this.fillForm(data);
                    this.appendToChat("Form updated with extracted details from text input.", "AI");
                } else {
                    this.appendToChat("No input provided.", "AI");
                }
            } catch (error) {
                this.appendToChat("Error calling API: " + error.message, "AI");
            }
        },
        async callAzureAIHTML(text) {

            this.appendToChat("Analyzing your input...", "AI");

            const apiKey = this.API_KEY
            const baseUrl = "https://documentparserapi20250524115701-b8ereadadvfebmfs.canadacentral-01.azurewebsites.net/api/workflow/handle"

            try {
                let response, data;

                if (text) {
                    response = await fetch(baseUrl, {
                        method: "POST",
                        headers: {
                            "Content-Type": "application/json",
                            "x-api-key": apiKey
                        },
                        body: JSON.stringify({
                            "UserMessage": text
                        })
                    });
                    data = await response.text();
                    if (this.isJSON(data)) {
                        const parsedData = JSON.parse(data);
                        if (parsedData.hasOwnProperty("moduleTitle")) {
                            this.openModule(parsedData)
                            this.appendToChat("I have pre-filled form based on extracted information.", "AI");
                        }
                        else {
                            this.appendToChat(data, "AI");
                        }
                    }
                    else {
                        this.appendToChat(data, "AI");
                    }


                } else {
                    this.appendToChat("No input provided.", "AI");
                }
            } catch (error) {
                this.appendToChat("Error calling API: " + error.message, "AI");
            }
        },
        openModule(parsedData) {
            window["prefilledData"] = parsedData
            if (location.hash != ("#/" + parsedData.moduleTitle))
                this.navigateTo("/" + parsedData.moduleTitle)

            setTimeout(() => {
                this.fillForm(parsedData);
            }, 1000);
            /* switch (parsedData.moduleTitle) {
                case "Supplier Contract Parser":
                case "Contract Requests":
                    this.navigateTo("/suppliers-creation")
                    break;
                default:
                    this.navigateTo("/")

            } */
        },
        isJSON(str) {
            try {
                const parsed = JSON.parse(str);
                return typeof parsed === 'object' && parsed !== null;
            } catch (e) {
                return false;
            }
        },
        fillForm(data) {
            if (!data) return;

            this.form = data
            /* if (data.supplierName) document.getElementById("supplierName").value = data.supplierName;
            if (data.contractTitle) document.getElementById("contractTitle").value = data.contractTitle;
            if (data.type) document.getElementById("type").value = data.type;
            if (data.department) document.getElementById("department").value = data.department;
            if (data.startDate) document.getElementById("startDate").value = data.startDate;
            if (data.endDate) document.getElementById("endDate").value = data.endDate;
            if (data.value) document.getElementById("value").value = data.value;
            if (data.paymentTerms) document.getElementById("paymentTerms").value = data.paymentTerms;
            if (data.email) document.getElementById("email").value = data.email;
            if (data.risk) document.getElementById("risk").value = data.risk;
            if (data.stakeholders) document.getElementById("stakeholders").value = data.stakeholders;
            if (data.justification) document.getElementById("justification").value = data.justification; */
        },
        navigateTo(path) {
            this.$router.push(path);
        }
    },
    computed: {
        isLanding() {
            let array = location.href.split('#/')
            return array.length == 2 ? array[1].length == 0 : true
        }
    },
    mounted() {

    }
});


router.beforeEach((to, from, next) => {
    if (to.path != '/')
        app.routeClicked = true;
    console.log('Navigated to:', to.path); // Optional debug
    next();
});