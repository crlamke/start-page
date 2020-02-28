/* 
 * The MIT License
 *
 * Copyright 2020 Chris Lamke <https://chris.lamke.org>.
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in
 * all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
 * THE SOFTWARE.
 */


/*
 // Create needed constants
 const list = document.querySelector('ul');
 const titleInput = document.querySelector('#title');
 const bodyInput = document.querySelector('#body');
 const form = document.querySelector('form');
 const submitBtn = document.querySelector('form button');
 
 
 function createDB() {
 
 // Open our database; it is created if it doesn't already exist
 // (see onupgradeneeded below)
 let request = window.indexedDB.open('linksDB', 1);
 
 // onerror handler signifies that the database didn't open successfully
 request.onerror = function () {
 console.log('Database failed to open');
 };
 
 // onsuccess handler signifies that the database opened successfully
 request.onsuccess = function () {
 console.log('Database opened succesfully');
 
 // Store the opened database object in the db variable. This is used a lot below
 db = request.result;
 
 // Run the displayData() function to display the notes already in the IDB
 displayData();
 };
 
 
 // Setup the database tables if this has not already been done
 request.onupgradeneeded = function (e) {
 
 // Grab a reference to the opened database
 let db = e.target.result;
 
 // Create an objectStore to store our notes in (basically like a single table)
 // including a auto-incrementing key
 let objectStore = db.createObjectStore('notes_os', {keyPath: 'id', autoIncrement: true});
 
 // Define what data items the objectStore will contain
 objectStore.createIndex('title', 'title', {unique: false});
 objectStore.createIndex('body', 'body', {unique: false});
 
 console.log('Database setup complete');
 
 }
 
 // Create an onsubmit handler so that when the form is submitted the addData() function is run
 form.onsubmit = addData;
 
 // Define the addData() function
 function addData(e) {
 // prevent default - we don't want the form to submit in the conventional way
 e.preventDefault();
 
 // grab the values entered into the form fields and store them in an object ready for being inserted into the DB
 let newItem = { title: titleInput.value, body: bodyInput.value };
 
 // open a read/write db transaction, ready for adding the data
 let transaction = db.transaction(['notes_os'], 'readwrite');
 
 // call an object store that's already been added to the database
 let objectStore = transaction.objectStore('notes_os');
 
 // Make a request to add our newItem object to the object store
 var request = objectStore.add(newItem);
 request.onsuccess = function() {
 // Clear the form, ready for adding the next entry
 titleInput.value = '';
 bodyInput.value = '';
 };
 
 // Report on the success of the transaction completing, when everything is done
 transaction.oncomplete = function() {
 console.log('Transaction completed: database modification finished.');
 
 // update the display of data to show the newly added item, by running displayData() again.
 displayData();
 };
 
 transaction.onerror = function() {
 console.log('Transaction not opened due to error');
 };
 }
 
 
 
 function deleteDB() {
 
 }
 
 // Store the currently loaded links to the Indexed DB
 // These links will be stored in the format: LinkText, Link HREF, LinkGroup
 function storeLinksToDB() {
 
 }
 
 // Load the stored links from the Indexed DB
 // These links are stored in the format: LinkText, Link HREF, LinkGroup
 function loadLinksFromDB() {
 
 }
 
 */