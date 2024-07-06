// categories is the main data structure for the app; it looks like this:

//  [
//    { title: "Math",
//      clues: [
//        {question: "2+2", answer: 4, showing: null},
//        {question: "1+1", answer: 2, showing: null}
//        ...
//      ],
//    },
//    { title: "Literature",
//      clues: [
//        {question: "Hamlet Author", answer: "Shakespeare", showing: null},
//        {question: "Bell Jar Author", answer: "Plath", showing: null},
//        ...
//      ],
//    },
//    ...
//  ]

let categories = [];
const NUM_CATEGORIES = 6;
const NUM_QUESTIONS_PER_CAT = 5;

/** Get NUM_CATEGORIES random category from API.
 *
 * Returns array of category ids
 */

async function getCategoryIds() {
    const res = await axios.get('https://rithm-jeopardy.herokuapp.com/api/categories', 
        { params: 
            { count: 100 } });
    const categoryIds = res.data.map(cat => cat.id);
    return _.sampleSize(categoryIds, NUM_CATEGORIES);                //Use lodash to get sample size for categories
}

/** Return object with data about a category:
 *
 *  Returns { title: "Math", clues: clue-array }
 *
 * Where clue-array is:
 *   [
 *      {question: "Hamlet Author", answer: "Shakespeare", showing: null},
 *      {question: "Bell Jar Author", answer: "Plath", showing: null},
 *      ...
 *   ]
 */

async function getCategory(catId) {
    const res = await axios.get(`https://rithm-jeopardy.herokuapp.com/api/category`, 
        { params: 
            { id: catId } });
    const category = res.data;
    const title = category.title.toUpperCase();
    return { title: title, clues: _.sampleSize(category.clues, NUM_QUESTIONS_PER_CAT) };
}

/** Fill the HTML table#jeopardy with the categories & cells for questions.
 *
 * - The <thead> should be filled w/a <tr>, and a <td> for each category
 * - The <tbody> should be filled w/NUM_QUESTIONS_PER_CAT <tr>s,
 *   each with a question for each category in a <td>
 *   (initally, just show a "?" where the question/answer would go.)
 */

async function fillTable() {
    $('#jeopardy thead').empty();
    $('#jeopardy tbody').empty();

    let headRow = $('<tr>');

    //populate the table header with category titles
    categories.forEach(cat => {
        headRow.append($('<th>').text(cat.title));
    });
    $('#jeopardy thead').append(headRow);

    //populate the rest of the table with the clues for each category
    for (let i = 0; i < 5; i++) {
        let row = $('<tr>');
        categories.forEach(cat => {
            let cell = $('<td>').text('?').data('clue', cat.clues[i]);
            row.append(cell);
        });
        $('#jeopardy tbody').append(row);
    }
}

/** Handle clicking on a clue: show the question or answer.
 *
 * Uses .showing property on clue to determine what to show:
 * - if currently null, show question & set .showing to "question"
 * - if currently "question", show answer & set .showing to "answer"
 * - if currently "answer", ignore click
 * */

function handleClick(e) {
    let cell = $(e.target);
    let clue = cell.data('clue');

    if (!clue.showing) {
        cell.text(clue.question);
        clue.showing = 'question';                  //show question
    } else if (clue.showing === 'question') {
        cell.text(clue.answer);
        clue.showing = 'answer';                    //show answer, else ignore additional clicks
    }
}

/** Wipe the current Jeopardy board, show the loading spinner,
 * and update the button used to fetch data.
 */

function showLoadingView() {
    //Wipe Jeopardy board
    $('#jeopardy thead').empty();
    $('#jeopardy tbody').empty();

    //Show loading spinner
    $('#loading-spinner').show();
    
    //Update button text to Loading during loading period and disable button
    $('#start').text('Loading...').show();
    $('#start').prop('disabled', true);
}

/** Remove the loading spinner and update the button used to fetch data. */

function hideLoadingView() {
    //Hide loading spinner
    $('#loading-spinner').hide();
    
    //Update button text back to normal and re-enable button
    $('#start').text('Start New Game')
    $('#start').prop('disabled', false);
}

/** Start game:
 *
 * - get random category Ids
 * - get data for each category
 * - create HTML table
 * */

async function setupAndStart() {
    showLoadingView();

    categories = [];
    const ids = await getCategoryIds();             //gets random category IDs
    for (let id of ids) {
        categories.push(await getCategory(id));     //gets category data
    }
    
    hideLoadingView();
    fillTable();
}

/** On click of start / restart button, set up game. */

//When the DOM loads, start game
$(function() {
    // Dynamically create header containing h1, button, and spinner
    const $header = $('<header>').appendTo('body');
    $('<h1>').text('Jeopardy!').appendTo($header);
    $('<div>').attr('id', 'loading-spinner').appendTo($header);
    $('<button>').text('Start New Game').attr('id', 'start').appendTo($header);

    // Dynamically create jeopardy table
    const $table = $('<table>').attr('id', 'jeopardy').appendTo('body');
    $('<thead>').appendTo($table);
    $('<tbody>').appendTo($table);

    //Start Game
    $('#start').on('click', setupAndStart);
    $('#jeopardy').on('click', 'td', handleClick);
});