let db;
//create a new db request for a "" database
const request = indexedDB.open("budget", 1);

request.onupgradeneeded = function (event) {
    const db = event.target.result;
    //create objectStore "pending" and autIncrement is set to true
    db.createObjectStore("new_budget", { autoIncrement: true });
};

request.onsuccess = function (event) {
    db = event.target.result;
    //check app to so if online before reading from db
    if (navigator.online) {
        checkDatabase();
    }
};

request.onerror = function (event) {
    console.log("somthing went wrong here" + event.target.errorCode);
};

function saveRecord(record) {
    //transaction with readwrite access
    const transaction = db.transaction(["new_budget"], "readwrite");
    //access the pending object store
    const store = transaction.objectStore("new_budget");
    //add to store with add method
    store.add(record);
}

function checkDatabase() {
    //open new transaction 
    const transaction = db.transaction(["pending"], "readwrite");
    //access pending objectStore
    const store = transaction.objectStore("new_budget");
    //get all records from sore and set equal to const getAll
    const getAll = store.getAll();

    getAll.onsuccess = function () {
        if (getAll.result.length > 0) {
            fetch("/api/transaction/bulk", {
                method: "POST",
                body: JSON.stringify(getAll.result),
                headers: {
                    Accept: "application/json, text/plain, */*",
                    "Content-Type": "application/json"
                }
            })
                .then(response => response.json())
                .then(() => {
                    //if complete successfully open a transaction on your pending db
                    const transaction = db.transaction(["new_budget"], "readwrite");
                    //access your pending objecStore
                    const store = transaction.objectStore("new_budget");
                    //clear out store
                    store.clear();
                });
        }
    };
}
//listen for when app comes back online
window.addEventListener("online", checkDatabase);