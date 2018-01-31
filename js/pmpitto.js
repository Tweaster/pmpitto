"use strict";

var CURRENT_VERSION = '0.0.8';


var lastClickedObject = null;
var gCurrentDeck = [];
var gCurrentEvaluationTags = [];
var NB_QUESTION_PER_ROUND = 6;
var gCurrentQuestionNb = 0;

var gCardCollection = null;

var gBucketScore = { 0 : 0, 1 : 1, 2 : 2, 3 : 10, 4 : 60, 5 : 300, 6 : 1440, 7 : 7200, 8 : 36000 };





function centerModalDialog()
{
  $('.modal.fade.in > .modal-dialog').css("opacity", "0");
  $('.modal.fade.in > .modal-dialog').css("margin-left", "-350px");
  var hmargin = Math.floor(($(window).width() - $('.modal.fade.in > .modal-dialog > .modal-content').width()) / 2);
  $('.modal.fade.in > .modal-dialog').animate({ left : "0px", marginLeft:  hmargin.toString() + "px", opacity : "1"}, 500); 
}


/******************************** RESIZE ****************************/

function containerWidth()
{
	return $(window).width();
}


function resizeEventHandler()
{
	var w = containerWidth();

	$('#top-shelf,#ui-drawer,.drawer-pin,.drawer-content').css("width", w.toString() + "px");


	if (w < 420)
	{
		$("div.card-card, div.user-card").css("width", (w - 18).toString() + "px");
		$("div.user-card > div.card-pin").css("width", (w - 18).toString() + "px")
		$("div.card-card, div.user-card").css("margin-left", "-2px");
		$("div.card-card, div.user-card").css("margin-top", "5px");
		$("div.card-card, div.user-card").css("margin-bottom", "5px");
		$("div#burndown-chart, div#velocity-chart, div#progression-pie-chart, div#workload-pie-chart").css("width", (w - 22).toString() + "px");

	}
	else
	{
		var minColumnWidth = 370;
		var nbColumn = Math.floor(w / (minColumnWidth + 22));
		var optimizedColumnWidth = Math.floor((w - (minColumnWidth + 22) * nbColumn - 45) / nbColumn) + minColumnWidth;

		$("div.card-card, div.user-card").css("width", (optimizedColumnWidth - 22).toString() + "px");
		$("div.user-card > div.card-pin").css("width", (optimizedColumnWidth + 8).toString() + "px")
		$("div.card-card, div.user-card").css("margin","15px " + Math.floor((w - optimizedColumnWidth) / 2).toString() + "px");
		$("div#burndown-chart, div#velocity-chart, div#progression-pie-chart, div#workload-pie-chart").css("width", (optimizedColumnWidth).toString() + "px");

	}
}








/******************************** UI INITIALIZATION ****************************/


function initService()
{

	var data = localStorage.getItem(app_id + ".data");
	if (typeof(data) !== "undefined" && data !== null && localStorage.getItem(app_id + ".version") === CURRENT_VERSION)
	{
		var o = JSON.parse(data);
		var newEvalDate =  Math.floor(Date.now() / 60000);
		Object.keys(o).forEach(
			function(key) {
		    	var card = new Card(o[key]);
		    	var newScore = card.getScore() - (newEvalDate - card.getLastEval());
		    	newScore = (0 > newScore) ? 0 : newScore;
		    	card.setScore(newScore);
		    	card.setLastEval(newEvalDate);
		});
	}
	else
	{
		createPMBOKProcesses();
	}

	NB_QUESTION_PER_ROUND = Number(localStorage.getItem(app_id + ".nbquestion"));

	localStorage.setItem(app_id + ".version", CURRENT_VERSION);

	if (typeof(NB_QUESTION_PER_ROUND) === "undefined" || NB_QUESTION_PER_ROUND === null  || NB_QUESTION_PER_ROUND < 6)
	{
		NB_QUESTION_PER_ROUND = 6;
	}
	localStorage.setItem(app_id + ".nbquestion", NB_QUESTION_PER_ROUND.toString());

	create();
}

function applyTheme(val)
{

}

function applyThemeOld(val)
{

}



function initUI()
{
	applyTheme();

	$("body").unbind().click(clickPerformed);
	$("body").bind("taphold", tapholdEventHandler);
	$("select#theme-popover-combo").change(
		function()
		{
			NB_QUESTION_PER_ROUND = Number($("select#theme-popover-combo").val());
			localStorage.setItem(app_id + ".nbquestion", NB_QUESTION_PER_ROUND.toString());
		}
	);

	setTimeout(
		function() 
		{
			$("#loader").toggleClass("ui-screen-hidden");
			$("#sticky").toggleClass("ui-screen-hidden");
			resizeEventHandler();
		},
		1500
	);
}

/******************************** CLICK HANDLING ****************************/

function clickPerformed(evt)
{
	lastClickedObject = $(evt.target);

	// settings
	if (lastClickedObject.is(".btn-settings"))
	{
		$("div#theme-popover").toggleClass("ui-screen-hidden");
		$("select#theme-popover-combo").val(localStorage.getItem(app_id + ".nbquestion"));
	}
	else if (lastClickedObject.is("a.icon.icon-bars.pull-left"))
	{
		backHome();
	}
	else if (lastClickedObject.is("a.ui-collapsible-heading-toggle.ui-btn.ui-icon-plus.ui-btn-icon-left.ui-btn-inherit"))
	{
		gCurrentEvaluationTags = [$(lastClickedObject).data("source")];
		startEvaluation();
	}
	else if (lastClickedObject.is("div.card-tag-caption"))
	{
		gCurrentEvaluationTags = [$(lastClickedObject).data("source")];
		startEvaluation();
	}
	else if (lastClickedObject.is("div.btn-expand-card"))
	{
		var card = CARDS[$(lastClickedObject).data("source")];
		if (typeof(card) !== "undefined" && (card instanceof Card))
	 	{
	 		//$('#' + card.id()).addClass('revealedCard');
	 		var html = `
	 					<div>

							{0}
							
						</div>

						<div>
							<div class="rating-btn easy" data-source="{1}">EASY</div>
							<div class="rating-btn medium" data-source="{1}">MEDIUM</div>
							<div class="rating-btn hard" data-source="{1}">HARD</div>
							<div class="rating-btn fail" data-source="{1}">FAIL</div>
						</div>
	 		`;
	 		$(".card-footer").html(String.format(html, markdown.toHTML(card.getVerso()), card.id()));
	 	}	
	}
	else if (lastClickedObject.is("div.rating-btn.easy"))
	{
		var card = CARDS[$(lastClickedObject).data("source")];
		if (typeof(card) !== "undefined" && (card instanceof Card))
	 	{
	 		card.rateCard("easy");
	 	}
	 	nextQuestion();
	}
	else if (lastClickedObject.is("div.rating-btn.medium"))
	{
		var card = CARDS[$(lastClickedObject).data("source")];
		if (typeof(card) !== "undefined" && (card instanceof Card))
	 	{
	 		card.rateCard("medium");
	 	}
	 	nextQuestion();
	}
	else if (lastClickedObject.is("div.rating-btn.hard"))
	{
		var card = CARDS[$(lastClickedObject).data("source")];
		if (typeof(card) !== "undefined" && (card instanceof Card))
	 	{
	 		card.rateCard("hard");
	 	}
	 	nextQuestion();
	}
	else if (lastClickedObject.is("div.rating-btn.fail"))
	{
		var card = CARDS[$(lastClickedObject).data("source")];
		if (typeof(card) !== "undefined" && (card instanceof Card))
	 	{
	 		card.rateCard("fail");
	 	}
	 	nextQuestion();
	}
}


function tapholdEventHandler(evt)
{

	var target = $(evt.target);
	if (target.is('li.table-view-cell') )
	{
		
	}
  
}


function toCard()
{
	$("li#menu-item-list-view").removeClass("checked");
	$("li#menu-item-calendar-view").addClass("checked");
	$("li#menu-item-stats-view").removeClass("checked");

	var w = $(window).width();
	$("#routine-detail-content").animate({ marginLeft : -w * 2}, 600);
	$("#listview-content").animate({ marginLeft : -w}, 600);
	$("#calendar-content").animate({ marginLeft : 0}, 600);
	$("#stats-content").animate({ marginLeft : w }, 600);
		
}


function backHome()
{
	$("li#menu-item-list-view").addClass("checked");
	$("li#menu-item-calendar-view").removeClass("checked");
	$("li#menu-item-stats-view").removeClass("checked");

	var w = $(window).width();
	$("#routine-detail-content").animate({ marginLeft : -w}, 600);
	$("#listview-content").animate({ marginLeft : 0}, 600);
	$("#calendar-content").animate({ marginLeft : w}, 600);
	$("#stats-content").animate({ marginLeft : w * 2}, 600);


	setTimeout(function(){ $('#project-calendar').html(''); }, 700);

	
}


function testInsert(caption, id)
{
	var str = `
	<div data-role="collapsible" class="ui-collapsible ui-collapsible-inset ui-corner-all ui-collapsible-themed-content ui-collapsible-collapsed"><h4 class="ui-collapsible-heading ui-collapsible-heading-collapsed"><a href="#" data-source="` + id + `" class="ui-collapsible-heading-toggle ui-btn ui-icon-plus ui-btn-icon-left ui-btn-inherit">` + caption + `<span class="ui-collapsible-heading-status"> click to expand contents</span></a></h4><div class="ui-collapsible-content ui-body-inherit ui-collapsible-content-collapsed" aria-hidden="true">
    
    <!--ul data-role="listview" class="ui-listview">
      <li class="ui-first-child"><a href="#" class="ui-btn ui-btn-icon-right ui-icon-carat-r">Adele</a></li>
      <li class="ui-last-child"><a href="#" class="ui-btn ui-btn-icon-right ui-icon-carat-r">Agnes</a></li>
    </ul-->
    </div></div>`;

    $('#listview-content').append(str);


}

function startEvaluation()
{
	toCard();

	gCurrentQuestionNb = 0;

	gCardCollection = new CardCollection(gCurrentEvaluationTags);
	gCurrentDeck = gCardCollection.getCards(NB_QUESTION_PER_ROUND);

	if (gCurrentDeck.length !== 0)
	{
		var card = gCurrentDeck[0];
		$('#project-calendar').html(htmlFromCard(card));
	}


}

function nextQuestion()
{
	gCurrentQuestionNb++;
	if (gCurrentQuestionNb ===  NB_QUESTION_PER_ROUND || gCurrentQuestionNb === gCurrentDeck.length )
	{
		startEvaluation();
	}

	var card = gCurrentDeck[gCurrentQuestionNb];

	$('.task-card').addClass('swipedOutCard');


	setTimeout(
		function() { 
				$('.swipedOutCard').remove();
				saveAll();
			 }
	, 1490);

	setTimeout(
		function() { 
				$('#project-calendar').prepend(htmlFromCard(card));
			}
	, 30);


	setTimeout(
		function() { 
				saveAll();
			 }
	, 3500);
	
}



function create()
{
	testInsert('All knowledge areas', 'pmbok_6th Ed');
	testInsert('Integration management', 'Integration');
	testInsert('Scope management', 'Scope');
	testInsert('Time management', 'Time');
	testInsert('Cost management', 'Cost');
	testInsert('Quality management', 'Quality');
	testInsert('HR management', 'HR');
	testInsert('Communication management', 'Communication');
	testInsert('Risk management', 'Risk');
	testInsert('Procurement management', 'Procurement');
	testInsert('Stakeholder management', 'Stakeholder');
}











var CARDS = {};
var TAGS = {};
var PROJECTS = {};




/* ---------------------------------------------------------------- *
 * class Tag
 *
 * summary: This class represents a Tag assigned to a card
 * description: This class represents a Tag assigned to a card.
 *		The purpose of tags is to classify and filter cards
 *
 * ---------------------------------------------------------------- */

class Tag
{
	/* ------------------------------------------------------------- *
	 * method: constructor
	 * ------------------------------------------------------------- */
	constructor(caption)
	{
		this._id = toSingleWord(caption);
		this._caption = caption;
		this._cards = {};

		TAGS[this._id] = this;

	}

	/* ------------------------------------------------------------- *
	 * method: id() returns the id of this tag
	 * ------------------------------------------------------------- */
	id()
	{
		return this._id;
	}

	/* ------------------------------------------------------------- *
	 * method: getCaption() returns the caption for this tag
	 * ------------------------------------------------------------- */
	getCaption()
	{
		return this._caption;
	}

	/* ------------------------------------------------------------- *
	 * method: addToCard() add the tag to the specified card
	 * ------------------------------------------------------------- */
	addToCard(card)
	{
		if (this._cards[card.id()] === null || typeof(this._cards[card.id()]) === "undefined")
		{
			this._cards[card.id()] = card.id();
		}
	}

	/* ------------------------------------------------------------- *
	 * method: removeFromCard() remove the tag from the specified card
	 * ------------------------------------------------------------- */
	removeFromCard(card)
	{
		if (this._cards[card.id()] !== null)
		{
			delete this._cards[card.id()];
		}
	}

	/* ------------------------------------------------------------- *
	 * method: getTaggedCards() returns the list of cards with current tag
	 * ------------------------------------------------------------- */
	 getTaggedCards()
	 {
	 	return Object.keys(this._cards);
	 }

	 /* ------------------------------------------------------------- *
	 * method: getOrCreateTag() returns the tag with the provided caption
	 * ------------------------------------------------------------- */
	 static getOrCreateTag(caption)
	 {
	 	var id = toSingleWord(caption);
	 	var result = TAGS[id];
	 	if (typeof(result) !== "undefined" && (result instanceof Tag))
	 	{
	 		return result;
	 	}
	 	else
	 	{
	 		return new Tag(caption);
	 	}
	 }
}


function saveAll()
{
	localStorage.setItem(app_id + ".data", JSON.stringify(CARDS));
}


/* ---------------------------------------------------------------- *
 * class Card
 *
 * summary: 
 * recto: 
 *
 * ---------------------------------------------------------------- */

class Card
{
	/* ------------------------------------------------------------- *
	 * method: constructor
	 * ------------------------------------------------------------- */
	constructor(object, recto, verso)
	{
		if(object instanceof Object)
		{
			this._id = object._id;
			this._caption = object._caption;
			this._recto = object._recto;
			this._verso = object._verso;
			this._tags = [];
			this._img = object._img;

			this._score = object._score;
			this._lastEval = object._lastEval;
			this._lastBucketIndex = object._lastBucketIndex;

			for (var i = 0; i < object._tags.length; i++)
			{
				this.addTag(object._tags[i]);
			}
		}
		else
		{
			this._id = guid();
			this._caption = object;
			this._recto = recto;
			this._verso = verso;
			this._tags = [];
			this._img = '../images/def.png';
			this.addTag('pmbok 6th Ed');
			this._score = -1;
			this._lastEval = -1;
			this._lastBucketIndex = 1;
		}
		

		CARDS[this._id] = this;

		
		saveAll();

	}


	/* ------------------------------------------------------------- *
	 * method: id() returns the id for the current card
	 * ------------------------------------------------------------- */
	id()
	{
		return this._id;
	}

	/* ------------------------------------------------------------- *
	 * method: getImage() returns the path for the iage for the current card
	 * ------------------------------------------------------------- */
	getImage()
	{
		return this._img;
	}

	

	/* ------------------------------------------------------------- *
	 * method: setImage() sets the iage for this card
	 * ------------------------------------------------------------- */
	setImage(path)
	{
		this._img = path;
		saveAll();
	}


	/* ------------------------------------------------------------- *
	 * method: setScore() sets the score for this card
	 * ------------------------------------------------------------- */
	setScore(score)
	{
		this._score = score;
		saveAll();
	}

	/* ------------------------------------------------------------- *
	 * method: getLastEval() returns last eval for the current card
	 * ------------------------------------------------------------- */
	getLastEval()
	{
		return this._lastEval;
	}

	/* ------------------------------------------------------------- *
	 * method: setLastEval() sets the last eval for this card
	 * ------------------------------------------------------------- */
	setLastEval(lastEval)
	{
		this._lastEval = lastEval;
	}

	/* ------------------------------------------------------------- *
	 * method: getScore() returns score for the current card
	 * ------------------------------------------------------------- */
	getScore()
	{
		return this._score;
	}


	/* ------------------------------------------------------------- *
	 * method: getBucketIndex() returns the bucket index for the current card
	 *         the higher the index, the least frequently asked is the card
	 * ------------------------------------------------------------- */
	getBucketIndex()
	{
		// new card
		if (this._score === gBucketScore[1])
		{
			return 1;
		}
		// 25 day
		else if (this._score >= gBucketScore[8])
		{
			return 8;
		}
		// 5 day
		else if (this._score >= gBucketScore[7])
		{
			return 7;
		}
		// 1 day
		else if (this._score >= gBucketScore[6])
		{
			return 6;
		}
		// 5h
		else if (this._score >= gBucketScore[5])
		{
			return 5;
		}
		//1 hour
		else if (this._score >= gBucketScore[4])
		{
			return 4;
		}
		// 10 min
		else if (this._score >= gBucketScore[3])
		{
			return 3;
		} 
		// 2min
		else if (this._score >= gBucketScore[2])
		{
			return 2;
		}
		// failed card
		else if (0 >= this._score)
		{
			return 0;
		}

		
	}



	rateCard(rating)
	{
		if (rating === "hard")
		{
			this._score = 9;
			this._lastBucketIndex = 2;
		}
		else if (rating === "fail")
		{
			this._score = -10;
			this._lastBucketIndex = 0;
		}
		else
		{
			this._lastBucketIndex = this._lastBucketIndex === 0 ? 2 : (this._lastBucketIndex + 1);
			this._lastBucketIndex = this._lastBucketIndex > 8 ? 8 : this._lastBucketIndex;
			this._score = gBucketScore[this._lastBucketIndex];
			if (rating === 'easy')
			{
				this._score *= 2;
			}
		}

		var newEvalDate =  Math.floor(Date.now() / 60000);
		this._lastEval = newEvalDate;
	}




	/* ------------------------------------------------------------- *
	 * method: caption() returns the caption for the current card
	 * ------------------------------------------------------------- */
	getCaption()
	{
		return this._caption;
	}

	/* ------------------------------------------------------------- *
	 * method: setCaption() sets the caption for this card
	 * ------------------------------------------------------------- */
	setCaption(caption)
	{
		this._caption = caption;
		saveAll();
	}


	/* ------------------------------------------------------------- *
	 * method: getRecto() returns the recto for this card
	 * ------------------------------------------------------------- */
	getRecto()
	{
		return this._recto;
	}

	/* ------------------------------------------------------------- *
	 * method: setRecto() sets the recto for this card
	 * ------------------------------------------------------------- */
	setRecto(recto)
	{
		this._recto = recto;
		saveAll();
	}

	/* ------------------------------------------------------------- *
	 * method: getVerso() returns the verso for this card
	 * ------------------------------------------------------------- */
	getVerso()
	{
		return this._verso;
	}

	/* ------------------------------------------------------------- *
	 * method: setVerso() sets the verso for this card
	 * ------------------------------------------------------------- */
	setVerso(verso)
	{
		this._verso = verso;
		saveAll();
	}


	/* ------------------------------------------------------------- *
	 * method: getTags() returns the tags for this card
	 * ------------------------------------------------------------- */
	getTags()
	{
		return this._tags;
	}

	/* ------------------------------------------------------------- *
	 * method: addTag() add a tag to this card
	 * ------------------------------------------------------------- */
	addTag(caption)
	{
		var tag = Tag.getOrCreateTag(caption);

		if (tag !== null && (tag instanceof Tag))
		{
	
			var i = this._tags.indexOf(caption);
			if (i === -1)
			{
				this._tags.push(caption);
				tag.addToCard(this);
				saveAll();
			}
		}

	}

	/* ------------------------------------------------------------- *
	 * method: removeTag() remove tag from this card
	 * ------------------------------------------------------------- */
	removeTag(caption)
	{
		var tagId = toSingleWord(caption);
		var tag = TAGS[tagId];

		if (tag !== null && (tag instanceof Tag))
		{
			var i = this._tags.indexOf(caption);
			if (i != -1)
			{
				this._tags.splice(i, 1);
			}
			tag.removeFromCard(this);
			saveAll();
		}
	}

	/* ------------------------------------------------------------- *
	 * method: hasTag() returns true if such a tag is found
	 * ------------------------------------------------------------- */
	hasTag(tag)
	{
		if (tag instanceof Tag)
		{
			return this._tags.indexOf(tag.id()) !== -1;
		}
		else if (typeof(tag) === "string")
		{
			return this._tags.indexOf(this._projectId + toSingleWord(tag)) !== -1;
		}
		return false;
	}

}




function cardFiltering(tagIdList)
{
	var counter = {};
	for (var i = 0; i < tagIdList.length; i++)
	{
		var tag = TAGS[tagIdList[i]];
		if (tag !== null && (tag instanceof Tag))
		{
			var cards = tag.getTaggedCards();
			if (i === 0)
			{
				for (var j = 0; j < cards.length; j++)
				{
					counter[cards[j]] = 1;
				}
			}
			else
			{
				for (var j = 0; j < cards.length; j++)
				{
					var currentVal = counter[cards[j]];
					if (typeof(currentVal) === "undefined" || currentVal === null)
						continue;

					counter[cards[j]] = currentVal + 1;
				}
			}
		}
	}

	var result = [];
	var okVal = tagIdList.length;
	var tmp = Object.keys(counter);
	for (var i = 0; i < tmp.length; i++)
	{
		if (counter[tmp[i]] === okVal)
		{
			var card = CARDS[tmp[i]];
			if (card !== null && (card instanceof Card))
			{
				result.push(card);
			}
		}
	}

	for (let i = result.length; i; i--) 
    {
        let j = Math.floor(Math.random() * i);
        [result[i - 1], result[j]] = [result[j], result[i - 1]];
    }

	return result;
}



function compareCards(a, b)
{
	if (b.getBucketIndex() > a.getBucketIndex()) { return -1; }
	if (a.getBucketIndex() > b.getBucketIndex()) { return 1; }

	if (b._lastBucketIndex > a._lastBucketIndex) { return -1; }
	if (a._lastBucketIndex > b._lastBucketIndex) { return 1; }

	return 0;
}


class CardCollection
{
	constructor(tagIdList)
	{
		this._cards = cardFiltering(tagIdList);
	}


	getCards(nbCards)
	{
		var result = [];
		this._cards.sort(compareCards);

		for (var i = 0; nbCards > i && this._cards.length > i; i++)
		{
			result.push(this._cards[i]);
		}

		for (let i = result.length; i; i--) 
	    {
	        let j = Math.floor(Math.random() * i);
	        [result[i - 1], result[j]] = [result[j], result[i - 1]];
	    }

	    return result;
	}


	fetchAverageScore()
	{
		var score = 0;
		for (var i = 0; this._cards.length > i; i++)
		{
			score += this._cards[i]._lastBucketIndex;
		}

		return Math.round(score / this._cards.length);
	}


}



function createITTOCard(type, caption, processCaption, versoList, pageNb)
{
	var typeStr = (type === 'inputs') ? 'inputs' : ((type === 'outputs') ? 'outputs' : 'tools & techniques');
	var q = 'Please provide the **' + typeStr + '** for the **' + processCaption + '** process found in the **' + caption + ' management** knowledge area of the PMBOK (Project Management Body Of Knowledge 6th Edition - p'+ pageNb.toString() +').';
	var answer = '####' + processCaption + '####\n\nThe **' + typeStr + '** for the **' + processCaption + '** process are {0}';


	var l = '\n\n';


	for (var i = 0; i < versoList.length; i++)
	{
		var item = versoList[i];

		if (typeof(item) === 'string')
		{
			l += (i + 1).toString() + '.  **' + versoList[i] + '**\n' ;
		}
		else
		{
			l += (i + 1).toString() + '.  ' + item[0] + '\n' ;
			for (var j = 1; j < item.length; j++)
			{
				l += '   * ' + item[j] + '\n' ;
			}
		}
	}

	var card = new Card(caption + ' management', q, String.format(answer, l));
	card.addTag(caption);
	card.addTag(processCaption);
	card.addTag(typeStr);
	card.setImage('./images/' + type + '.png');

}




function htmlFromTags(card)
{
	var tags = card.getTags();

	var result = "";

	for (var i = 0; i < tags.length; i++)
	{
		result += '<div class="card-tag"><div class="card-tag-caption" data-source="' + toSingleWord(tags[i]) + '">' + tags[i] + '</div></div>' ;
	}

	return result;
	
}

function htmlFromCard(card)
{
	var cardScore = {0 : 0, 1 : 0, 2 : 10, 3: 30, 4 : 50, 5 : 60, 6 : 75, 7 : 90, 8 : 100};
	var scoreLabel = {0 :'fail', 1 : 'new', 2 : 'low', 3: 'average', 4 : 'good', 5 : 'great', 6 : 'strong', 7 : 'master', 8 : 'genius'};
	var html = `
	<div class="task-card swipedInCard" id="{0}" >
				<div class="card-pin"></div>
				<div class="card-title">
					<div class="avatar-container"><img src="{5}" alt="anton sørensen" class="user-small-avatar" ></div>
					<h3>{1}</h3>
					<!--div class="btn-edit-task" data-source="{0}"></div-->
				</div>
				<div class="card-content">
					<div class="crumb" data-source="pHSLp6LEobTQl"> » pmbok</div><div class="crumb" data-source="nFjNY7yLobTQl"> » {4} management</div>
					<div class="task-description">
					
					{2}
					</div>
					<div class="tag-container">
						{3}<!--div class="btn-edit-tags" data-source="{0}"></div-->
					</div>

				</div>

				<div class="circular-progress"><div class="c100 p{6} small ">    <span data-from="0" data-to="{6}" class="project-progress">{7}</span>    <div class="slice">        <div class="bar"></div>        <div class="fill"></div>    </div></div><h3>card score</h3></div>

				<div class="circular-progress"><div class="c100 p{8} small ">    <span data-from="0" data-to="{8}" class="project-progress">{9}</span>    <div class="slice">        <div class="bar"></div>        <div class="fill"></div>    </div></div><h3>set score</h3></div>

				<div class="card-footer">
					
					<div class="card-bottom-btn-container">
						<div class="btn-expand-card" data-source="{0}">
						</div>
						
						<div>
							 Reveal answer.
						</div>

						

					</div>
				</div>
			</div>

	`;



	var avgScore = gCardCollection.fetchAverageScore();

	return String.format(
		html,
		card.id(),
		card.getCaption(),
		markdown.toHTML(card.getRecto()),
		htmlFromTags(card),
		card.getTags()[1],
		card.getImage(),
		cardScore[card._lastBucketIndex].toString(),
		scoreLabel[card._lastBucketIndex],
		cardScore[avgScore].toString(),
		scoreLabel[avgScore]
	);
}



function createPMBOKProcesses()
{

	/* INTEGRATION */

	createITTOCard('inputs', 'Integration', 'Develop Project Charter', [['Business documents', 'Business case', 'Benefits management plan'], 'Agreements', 'Enterprise environmental factors', 'Organizational process assets'], 75);
	createITTOCard('tools', 'Integration', 'Develop Project Charter', ['Expert judgment', ['Data gathering', 'Brainstorming', 'Focus groups', 'Interviews'], ['Interpersonal and team skills', 'Conflict management', 'Meeting management'], 'Meetings'], 75);
	createITTOCard('outputs', 'Integration', 'Develop Project Charter', ['Project charter', 'Assumption log'], 75);

	createITTOCard('inputs', 'Integration', 'Develop Project Management Plan', ['Project charter', 'Outputs from other processes', 'Enterprise environmental factors', 'Organizational process assets'], 82);
	createITTOCard('tools', 'Integration', 'Develop Project Management Plan', ['Expert judgment', ['Data gathering', 'Brainstorming', 'Checklists', 'Focus groups', 'Interviews'], ['Interpersonal and team skills', 'Conflict management', 'Facilitation', 'Meeting management'], 'Meetings'], 82);
	createITTOCard('outputs', 'Integration', 'Develop Project Management Plan', ['Project management plan'], 82);


	createITTOCard('inputs', 'Integration', 'Direct and Manage Project Work', [['Project management plan', 'Any component'], ['Project documents', 'Change log','Lessons learned register', 'Milestone list', 'Project communications', 'Project schedule', 'Requirements traceability matrix', 'Risk register', 'Risk report'], 'Approved change requests', 'Enterprise environmental factors', 'Organizational process assets'], 90);
	createITTOCard('tools', 'Integration', 'Direct and Manage Project Work', ['Expert judgment', 'Project management information system', 'Meetings'], 90);
	createITTOCard('outputs', 'Integration', 'Direct and Manage Project Work', ['Deliverables', 'Work performance data', 'Change requests', ['Project management plan updates', 'Any component'], ['Project documents updates', 'Activity list', 'Assumption log', 'Lessons learned register', 'Requirements documentation', 'Risk register', 'Stakeholder register'], 'Organizational process assets updates'], 90);

	createITTOCard('inputs', 'Integration', 'Manage Project Knowledge', [['Project management plan', 'All components'], ['Project documents', 'Lessons learned register', 'Project team assignments', 'Resource breakdown structure', 'Source selection criteria', 'Stakeholder register'], 'Deliverables', 'Enterprise environmental factors', 'Organizational process assets'], 98);
	createITTOCard('tools', 'Integration', 'Manage Project Knowledge', ['Expert judgment', 'Knowledge management', 'Information management', ['Interpersonal and team skills', 'Active listening', 'Facilitation', 'Leadership', 'Networking', 'Political awareness']], 98);
	createITTOCard('outputs', 'Integration', 'Manage Project Knowledge', ['Lessons learned register', ['Project management plan updates', 'Any component'], 'Organizational process assets updates'], 98);


	createITTOCard('inputs', 'Integration', 'Monitor and Control Project Work', [['Project management plan', 'Any component'], ['Project dcuments', 'Assumption log','Basis of estimates', 'Cost forecasts', 'Issue log', 'Lessons learned register', 'Milestone list', 'Quality reports', 'Risk register', 'Risk report', 'Schedule forecasts'], 'Work performance information', 'Agreements','Enterprise environmental factors', 'Organizational process assets'], 105);
	createITTOCard('tools', 'Integration', 'Monitor and Control Project Work', ['Expert judgment', ['Data analysis', 'Alternative analysis', 'Cost-benefit analysis', 'Earned value analysis', 'root cause analysis'], 'Decision making', 'Meetings'], 105);
	createITTOCard('outputs', 'Integration', 'Monitor and Control Project Work', ['Work performance reports', 'Change requests', ['Project management plan updates', 'Any component'], ['Project documents updates, Cost forecasts', 'Issue log', 'Lessons learned register', 'Risk register', 'Schedule forecasts']], 105);

	createITTOCard('inputs', 'Integration', 'Perform Integrated Change Control', [['Project management plan', 'Change management plan', 'Configuration management plan', 'Scope baseline', 'Schedule baseline', 'Cost baseline'], ['Project documents', 'Basis of estimates', 'Requirements traceability matrix', 'Risk report'],'Work performance reports', 'Change requests', 'Enterprise environmental factors', 'Organizational process assets'], 113);
	createITTOCard('tools', 'Integration', 'Perform Integrated Change Control', ['Expert judgment', 'Change control tools', ['Data analysis', 'Alternative analysis', 'Cost-benefit analysis'],['Decision making', 'Voting', 'Autocratic decision making', 'Multicriteria decision analysis'], 'Meetings'], 113);
	createITTOCard('outputs', 'Integration', 'Perform Integrated Change Control', ['Approved change requests', ['Project management plan updates', 'Any component'], ['Project documents updates', 'Change log']], 113);

	createITTOCard('inputs', 'Integration', 'Close Project or Phase', ['Project charter', ['Project management plan' , 'All component'], ['Project documents', 'Assumption log', 'Basis of estimates', 'Change log', 'Issue log','Lessons learned register', 'Milestone list', 'Project communications', 'Quality control measurements', 'Requirements documentation', 'Risk register', 'Risk report'], 'Accepted deliverables', ['Business documents', 'Business case', 'Benefits management plan'], 'Agreements', 'Procurement documentation', 'Organizational process assets'], 121);
	createITTOCard('tools', 'Integration', 'Close Project or Phase', ['Expert judgment', ['Data analysis', 'Document analysis', 'Regression analysis', 'Trend analysis', 'Variance analysis'], 'Meetings'], 121);
	createITTOCard('outputs', 'Integration', 'Close Project or Phase', [['Project documents updates', 'Lessons learned register'],'Final product, service, or result transition', 'Final report', 'Organizational process assets updates'], 121);


	/* SCOPE */

	
	createITTOCard('inputs', 'Scope', 'plan scope management', ['Project charter', ['Project management plan', 'Quality management plan', 'Project life cycle description', 'Development approach'], 'Enterprise environmental factors','Organizational process assets'], 134);
	createITTOCard('tools', 'Scope', 'plan scope management', ['Expert judgment',['Data analysis', 'Alternative analysis'], 'Meetings'], 134);
	createITTOCard('outputs', 'Scope', 'plan scope management', ['Scope management plan','Requirements management plan'], 134);

	createITTOCard('inputs', 'Scope', 'collect requirements', ['Project Charter',['Project management plan', 'Scope management plan','Requirements management plan','Stakeholder engagement plan'],['Project documents', 'Assumption log', 'Lessons learned register', 'Stakeholder register'], ['Business documents', 'Business case'], 'Agreements', 'Enterprise environmental factors', 'Organizational process assets'], 138);
	createITTOCard('tools', 'Scope', 'collect requirements', ['Expert judgment', ['Data gathering', 'Brainstorming', 'Interviews', 'Focus groups', 'Questionnaires and surveys', 'Benchmarking'], ['Data analysis', 'Document analysis'], ['Decision making', 'Voting', 'Multicriteria decision analysis'], ['Data representation', 'Affinity diagrams', 'Mind mapping'], ['Interpersonal and team skills', 'Nominal group technique', 'Observation/conversation', 'Facilitation'], 'Context diagram', 'Prototypes'], 138);
	createITTOCard('outputs', 'Scope', 'collect requirements', ['Requirements documentation','Requirements traceability matrix'], 138);

	createITTOCard('inputs', 'Scope', 'define Scope', ['Project charter', ['Project management plan', 'Scope management plan'], ['Project documents', 'Assumption log', 'Requirements documentation', 'Risk register'], 'Enterprise environmental factors', 'Organizational process assets'], 150);
	createITTOCard('tools', 'Scope', 'define Scope', ['Expert judgment',['Data analysis','Alternatives analysis'],['Decision making', 'Multicriteria decision analysis'], ['Interpersonal and team skills', 'Facilitation'], 'Product analysis'], 150);
	createITTOCard('outputs', 'Scope', 'define Scope', ['Project scope statement',['Project documents updates', 'Assumption log', 'Requirements documentation', 'Requirements traceability matrix', 'Stakeholder register']], 150);

	createITTOCard('inputs', 'Scope', 'create WBS', [['Project management plan','Scope management plan'], ['Project documents', 'Project scope statement','Requirements documentation'],'Enterprise environmental factors','Organizational process assets'], 156);
	createITTOCard('tools', 'Scope', 'create WBS', ['Decomposition','Expert judgment'], 156);
	createITTOCard('outputs', 'Scope', 'create WBS', ['Scope baseline',['Project documents updates', 'Assumption log', 'Requirements documentation']], 156);

	createITTOCard('inputs', 'Scope', 'Validate Scope', [['Project management plan', 'Scope management plan', 'Requirements management plan', 'Scope baseline'],['Project documents', 'Lessons learned register', 'Quality reports','Requirements documentation','Requirements traceability matrix'],'Verified deliverables','Work performance data'], 163);
	createITTOCard('tools', 'Scope', 'Validate Scope', ['Inspection',['Decision making', 'Voting']], 163);
	createITTOCard('outputs', 'Scope', 'Validate Scope', ['Accepted deliverables','Change requests','Work performance information',['Project documents updates', 'Lessons learned register', 'Requirements documentation', 'Requirements traceability matrix']], 163);

	createITTOCard('inputs', 'Scope', 'control Scope', [['Project management plan', 'Scope management plan', 'Requirements management plan', 'Change management plan', 'Configuration management plan', 'Scope baseline'],['Project documents', 'Lessons learned register', 'Requirements documentation','Requirements traceability matrix'],'Work performance data','Organizational process assets'], 167);
	createITTOCard('tools', 'Scope', 'control Scope', [['Data analysis', 'Trend analysis', 'Variance analysis']], 167);
	createITTOCard('outputs', 'Scope', 'control Scope', ['Work performance information','Change requests',['Project management plan updates', 'Scope management plan', 'Scope baseline', 'Schedule baseline', 'Cost baseline', 'Performance measurement baseline'],['Project documents updates', 'Lessons learned register', 'Requirements documentation', 'Requirements traceability matrix']], 167);


	/*TIME */
	createITTOCard('inputs', 'Time', 'Plan Schedule Management', ['Project charter', ['Project management plan', 'Scope management plan', 'Development approach'],'Enterprise environmental factors','Organizational process assets'], 179);
	createITTOCard('tools', 'Time', 'Plan Schedule Management', ['Expert judgment','Data analysis', 'Meetings'], 179);
	createITTOCard('outputs', 'Time', 'Plan Schedule Management', ['Schedule management plan'], 179);


	createITTOCard('inputs', 'Time', 'define Activities', [['Project management plan', 'Schedule management plan','Scope baseline'],'Enterprise environmental factors','Organizational process assets'], 183);
	createITTOCard('tools', 'Time', 'define Activities', ['Decomposition','Rolling wave planning','Expert judgment', 'Meetings'], 183);
	createITTOCard('outputs', 'Time', 'define Activities', ['Activity list','Activity attributes','Milestone list', 'Change requests', ['Project management plan updates', 'Schedule baseline', 'Cost baseline']], 183);

	createITTOCard('inputs', 'Time', 'Sequence Activities', [['Project management plan', 'Schedule management plan', 'Scope baseline'], ['Project documents', 'Activity list','Activity attributes','Milestone list', 'Assumption log'],'Enterprise environmental factors','Organizational process assets'], 187);
	createITTOCard('tools', 'Time', 'Sequence Activities', ['Precedence diagramming method (PDM)','Dependency determination','Leads and lags', 'Project management information systems'], 187);
	createITTOCard('outputs', 'Time', 'Sequence Activities', ['Project schedule network diagrams',['Project documents updates', 'Activity list', 'Activity attributes', 'Milestone list', 'Assumption log']], 187);

	createITTOCard('inputs', 'Time', 'Estimate Activity durations', [['Project management plan', 'Schedule management plan', 'Scope baseline'], ['Project documents', 'Activity list','Activity attributes', 'Milestone list', 'Assumption log', 'Lessons learned register', 'Project team assignments', 'Resource calendars','Resource requirements','Resource breakdown structure', 'Risk register'],'Enterprise environmental factors','Organizational process assets'], 195);
	createITTOCard('tools', 'Time', 'Estimate Activity durations', ['Expert judgment','Analogous estimating','Parametric estimating','Three-point estimating','Bottom-up estimating', ['Data analysis', 'Alternative analysis', 'Reserve analysis'], 'Decision making', 'Meetings'], 195);
	createITTOCard('outputs', 'Time', 'Estimate Activity durations', ['Duration estimates', 'Basis of estimates', ['Project documents updates', 'Activity attributes', 'Assumption log', 'Lessons learned register']], 195);

	createITTOCard('inputs', 'Time', 'develop Schedule', [['Project management plan', 'Schedule management plan', 'Scope baseline'],['Project documents', 'Activity list','Activity attributes', 'Milestone list', 'Assumption log', 'Basis of estimates', 'Duration estimates', 'Lessons learned register', 'Project schedule network diagrams', 'Project team assignments', 'Resource calendars','Resource requirements', 'Risk register'],'Agreements', 'Enterprise environmental factors','Organizational process assets'], 205);
	createITTOCard('tools', 'Time', 'develop Schedule', ['Schedule network analysis','Critical path method','Resource optimization techniques',['Data analysis', 'What-if scenario analysis', 'Simulation'],'Leads and lags','Schedule compression','Project management information system', 'Agile release planning'], 205);
	createITTOCard('outputs', 'Time', 'develop Schedule', ['Schedule baseline','Project schedule','Schedule data','Project calendars', 'Change requests', ['Project management plan updates', 'Schedule management plan', 'Scope baseline'],['Project documents updates', 'Activity attributes', 'Assumption log', 'Duration estimates', 'Lessons learned register', 'Resource requirements', 'Risk register']], 205);

	
	createITTOCard('inputs', 'Time', 'control Schedule', [['Project management plan', 'Schedule management plan', 'Schedule baseline', 'Scope baseline', 'Performance measurement baseline'],['Project documents', 'Lessons learned register', 'Project calendars', 'Project schedule', 'Resource calendars', 'Schedule data'],'Work performance data', 'Organizational process assets'], 222);
	createITTOCard('tools', 'Time', 'control Schedule', [['Data analysis', 'Earned value analysis', 'Iteration burndown chart', 'Performance reviews', 'Trend analysis', 'Variance analysis', 'Waht-if scenario analysis'], 'Critical path method', 'Project management information system', 'Resource optimization','Leads and lags','Schedule compression'], 222);
	createITTOCard('outputs', 'Time', 'control Schedule', ['Work performance information', 'Schedule forecasts', 'Change requests',['Project management plan updates', 'Schedule management plan', 'Schedule baseline', 'Cost baseline', 'Performance measurement baseline'],['Project documents updates', 'Assumption log', 'Basis of estimates', 'Lessons learned register', 'Project schedule', 'Resource calendars','Risk register', 'Schedule data']], 222);


	/* COST */
	
	createITTOCard('inputs', 'Cost', 'Plan Cost Management', ['Project charter', ['Project management plan', 'Schedule management plan', 'Risk management plan'],'Enterprise environmental factors','Organizational process assets'], 235);
	createITTOCard('tools', 'Cost', 'Plan Cost Management', ['Expert judgment','Data analysis','Meetings'], 235);
	createITTOCard('outputs', 'Cost', 'Plan Cost Management', ['Cost management plan'], 235);

	createITTOCard('inputs', 'Cost', 'Estimate Costs', [['Project management plan', 'Cost management plan','Quality management plan', 'Scope baseline'],['Project documents', 'Lessons learned register','Project schedule', 'Resources requirements', 'Risk register'],'Enterprise environmental factors','Organizational process assets'], 240);
	createITTOCard('tools', 'Cost', 'Estimate Costs', ['Expert judgment', 'Analogous estimating', 'Parametric estimating', 'Bottom-up estimating', 'Three-point estimating', ['Data analysis', 'Alternative analysis', 'Reserve analysis', 'Cost of quality'], 'Project management information system', ['Decision making', 'Voting']], 240);
	createITTOCard('outputs', 'Cost', 'Estimate Costs', ['Activity cost estimates','Basis of estimates',['Project documents updates', 'Assumption log', 'Lessons learned register', 'Risk register']], 240);

	createITTOCard('inputs', 'Cost', 'Determine Budget', [['Project management plan', 'Cost management plan', 'Resource management plan', 'Scope baseline'], ['Project documents', 'Cost estimates', 'Basis of estimates', 'Project schedule', 'Risk register'], ['Business documents', 'Business case', 'Benefits management plan'],'Agreements', 'Enterprise environmental factors','Organizational process assets'], 248);
	createITTOCard('tools', 'Cost', 'Determine Budget', ['Cost aggregation', ['Data analysis','Reserve analysis'], 'Expert judgment', 'Historical information review' ,'Funding limit reconciliation', 'Financing'], 248);
	createITTOCard('outputs', 'Cost', 'Determine Budget', ['Cost baseline', 'Project funding requirements', ['Project documents updates', 'Cost estmaites', 'Project schedule', 'Risk register']], 248);

	createITTOCard('inputs', 'Cost', 'Control Cost', [['Project management plan', 'Cost management plan', 'Cost baseline', 'Performance measurement baseline'], ['Project documents', 'Lessons learned register'], 'Project funding requirements', 'Work performance data', 'Organizational process assets'], 257);
	createITTOCard('tools', 'Cost', 'Control Cost', ['Expert judgment', ['Data analysis', 'Earned value analysis', 'Trend analysis', 'Variance analysis', 'Reserve analysis'], 'To-complete performance index (TCPI)',  'Project management information system'], 257);
	createITTOCard('outputs', 'Cost', 'Control Cost', ['Work performance information', 'Cost forecasts', 'Change requests',['Project management plan updates', 'Cost management plan', 'Cost baseline', 'Performance measurement baseline'],['Project documents updates', 'Assumption log', 'Basis of estimates', 'Cost estimates', 'Lessons learned register', 'Risk register']], 257);


	/* QUALITY */
	
	createITTOCard('inputs', 'Quality', 'Plan Quality Management', ['Project charter', ['Project management plan', 'Requirements management plan', 'Risk management plan', 'Stakeholder engagement plan', 'Scope baseline'], ['Project documents', 'Assumption log', 'Requirements traceability matrix', 'Stakeholder register', 'Risk register', 'Requirements documentation'], 'Enterprise environmental factors', 'Organizational process assets'], 277);
	createITTOCard('tools', 'Quality', 'Plan Quality Management', ['Expert judgment',  ['Data gathering', 'Benchmarking', 'Brainstorming', 'Interviews'], ['Decision making', 'Multicriteria decision analysis'], ['Data representation', 'Flowcharts', 'Logical data model', 'Matrix diagrams', 'Mind mapping'], 'Test and Inspection planning', 'Meetings'], 277);
	createITTOCard('outputs', 'Quality', 'Plan Quality Management', ['Quality management plan', 'Quality metrics',['Project management plan updates', 'Risk management plan', 'Scope baseline'], ['Project documents updates', 'Lessons learned register', 'Requirements traceability matrix'], 'Risk register', 'Stakeholder register'], 277);

	createITTOCard('inputs', 'Quality', 'Manage Quality', [['Project management plan', 'Quality management plan'], ['Project documents', 'Lessons learned register',  'Quality metrics', 'Quality control measurements', 'Risk register'], 'Organizational process assets'], 288);
	createITTOCard('tools', 'Quality', 'Manage Quality', [['Data gathering', 'Checklists'], ['Data analysis', 'Alternative analysis', 'Document analysis', 'Process analysis', 'Root cause analysis'], ['Decision making', 'Multicriteria decision analysis'], ['Data representation', 'Affinity diagrams', 'Cause-and-effect diagrams', 'Flowcharts', 'Histograms', 'Matrix diagrams','Scatter diagrams'], 'Audits', 'Design for X', 'Problem solving', 'Quality improvement methods'], 288);
	createITTOCard('outputs', 'Quality', 'Manage Quality', ['Quality reports', 'Test and evaluation documents', 'Change requests', ['Project management plan updates', 'Quality management plan', 'Scope baseline', 'Schedule baseline', 'Cost baseline'], ['Project documents updates', 'Issue log', 'Lessons learned register', 'Risk register']], 288);

	createITTOCard('inputs', 'Quality', 'Control Quality', [['Project management plan', 'Quality management plan'], ['Project documents', 'Lessons learned register', 'Quality metrics', 'Test and evaluation documents'],  'Work performance data', 'Approved change requests', 'Deliverables', 'Enterprise environmental factors', 'Organizational process assets'], 298);
	createITTOCard('tools', 'Quality', 'Control Quality', ['Data gathering'], 298);
	createITTOCard('outputs', 'Quality', 'Control Quality', ['Quality control measurements', 'Validated changes', 'Verified deliverables', 'Work performance information ', 'Change requests ', ['Project management plan updates', 'Quality management plan'], ['Project documents updates', 'Issue log', 'Lessons learned register', 'Risk register', 'Test and evaluation documents']], 298);

	/* HUMAN RESOURCES */
	
	createITTOCard('inputs', 'HR', 'Plan Human Resource Management', ['Project charter', ['Project management plan', 'Quality management plan', 'Scope baseline'], ['Project documents', 'Project schedule', 'Requirements documentation', 'Risk register', 'Stakeholder register'], 'Enterprise environmental factors', 'Organizational process assets'], 312);
	createITTOCard('tools', 'HR', 'Plan Human Resource Management', ['Expert judgment', ['Data representation', 'Hierarchical charts', 'Responsibility assignment matrix', 'Text-oriented formats'], 'Organizational theory', 'Meetings'], 312);
	createITTOCard('outputs', 'HR', 'Plan Human Resource Management', ['Resource management plan', 'Team charter', ['Project document updates', 'Assumption log', 'Risk register']], 312);

	createITTOCard('inputs', 'HR', 'Estimate Activity Resources', [['Project management plan', 'Resource management plan', 'Scope baseline'], ['Project documents', 'Activity attributes', 'Activity list', 'Risk register', 'Assumption log', 'Cost estimates', 'Resource estimates'], 'Enterprise environmental factors', 'Organizational process assets'], 321);
	createITTOCard('tools', 'HR', 'Estimate Activity Resources', ['Expert judgment','Bottom-up estimating', 'Analogous estimating', 'Parametric estimating', ['Data analysis', 'Alternative analysis'], 'Project management information system', 'Meetings'], 321);
	createITTOCard('outputs', 'HR', 'Estimate Activity Resources', ['Resource requirements', 'Basis of estimates', 'Resource breakdown structure', ['Project document updates', 'Activity attributes', 'Assumption log', 'Lessons learned register']], 321);

	createITTOCard('inputs', 'HR', 'Acquire Project Team', [['Project management plan', 'Resource management plan', 'Procurement management plan', 'Cost baseline'], ['Project documents', 'Project schedule', 'Resource calendars', 'Resource requirements', 'Stakeholder register'], 'Enterprise environmental factors', 'Organizational process assets'], 328);
	createITTOCard('tools', 'HR', 'Acquire Project Team', ['Pre-assignment', ['Interpersonal and team skills', 'Negotiation'], 'Virtual teams', ['Decision making', 'Multicriteria decision analysis']], 328);
	createITTOCard('outputs', 'HR', 'Acquire Project Team', ['Physical resource assignments', 'Project team assignments', 'Resource calendars', 'Change requests', ['Project management plan updates', 'Resource management plan', 'Cost baseline'], ['Project document updates', 'Lessons learned register', 'Project schedule', 'Resource breakdown structure', 'Resource requirements', 'Risk register'], 'Enterprise environmental factors', 'Organizational process assets'], 328);

	createITTOCard('inputs', 'HR', 'Develop Team', [['Project management plan', 'Resource management plan'], ['Project documents', 'Lessons learned register', 'Project schedule',  'Project team assignments', 'Resource calendars', 'Team charter'], 'Enterprise environmental factors', 'Organizational process assets'], 336);
	createITTOCard('tools', 'HR', 'Develop Team', ['Virtual teams', 'Communication technology', ['Interpersonal  and team skills', 'Conflict management', 'Influencing', 'Motivation', 'Negotiation', 'Team building'], 'Training', 'Colocation', 'Recognition and rewards', 'Individual and team assessment tools', 'Meetings'], 336);
	createITTOCard('outputs', 'HR', 'Develop Team', ['Team performance assessments', 'Change requests', ['Project management plan updates', 'Resource management plan'],  ['Project documents updates', 'Lessons learned register', 'Project schedule', 'Project team assignments', 'Resource calendars', 'Team charter'], 'Enterprise environmental factors updates', 'Organizational process assets'], 336);

	createITTOCard('inputs', 'HR', 'Manage Team', [['Project management plan', 'Resource management plan'], ['Project documents', 'Issue log', 'Lessons learned register', 'Project team assignments'], 'Team performance assessments', 'Work performance reports', 'Organizational process assets', 'Enterprise environmental factors'], 345);
	createITTOCard('tools', 'HR', 'Manage Team', [['Interpersonal and team skills', 'Conflict management', 'Decision making', 'Emotional intelligence', 'Influencing', 'Leadership'], 'Project management information system'], 345);
	createITTOCard('outputs', 'HR', 'Manage Team', ['Change requests', ['Project management plan updates', 'Resource management plan', 'Schedule baseline', 'Cost baseline'], ['Project documents updates', 'Issue log', 'Lessons learned register', 'Project team assignments'], 'Enterprise environmental factors updates', 'Organizational process assets updates'], 345);

	createITTOCard('inputs', 'HR', 'Control Resources', [['Project management plan', 'Resource management plan'], ['Project documents', 'Issue log', 'Lessons learned register', 'Physical resource assignments', 'Project schedule', 'Resource breakdown structure', 'Resource requirements', 'Risk register'], 'Agreements', 'Work performance data', 'Organizational process assets', 'Enterprise environmental factors'], 352);
	createITTOCard('tools', 'HR', 'Control Resources', [['Data analysis', 'Alternative analysis', 'Cost-benefit analysis', 'Performance reviews', 'Trend analysis'], 'Problem solving' , ['Interpersonal and team skills', 'Negotiation', 'Influencing'], 'Project management information system'], 352);
	createITTOCard('outputs', 'HR', 'Control Resources', ['Work performance information','Change requests', ['Project management plan updates', 'Resource management plan', 'Schedule baseline', 'Cost baseline'], ['Project documents updates', 'Assumption log', 'Issue log', 'Lessons learned register', 'Physical resource assignments', 'Resource breakdown structure', 'Risk register']], 352);

	/* COMMUNICATION */
	
	createITTOCard('inputs', 'Communication', 'Plan Communications Management', ['Project charter', ['Project management plan', 'Resource management plan', 'Stakeholder engagement plan'], ['Project documents', 'Requirements documentation', 'Stakeholder register'], 'Enterprise environmental factors', 'Organizational process assets'], 366);
	createITTOCard('tools', 'Communication', 'Plan Communications Management', ['Expert judgement', 'Communication requirements analysis', 'Communication technology', 'Communication models', 'Communication methods', ['Interpersonal and team skills', 'Communication styles assessment', 'Political awareness', 'Cultural awareness'], ['Data representation', 'Stakeholder engagement matrix'], 'Meetings'], 366);
	createITTOCard('outputs', 'Communication', 'Plan Communications Management', ['Communications management plan', ['Project management plan updates', 'Stakeholder engagement plan'], ['Project documents updates', 'Project schedule', 'Stakeholder register']], 366);

	createITTOCard('inputs', 'Communication', 'Manage Communications', [['Project management plan', 'Communications management plan', 'Resource management plan', 'Stakeholder engagement plan'], ['Project documents', 'Change log', 'Issue log', 'Lessons learned register', 'Quality report', 'Risk report', 'Stakeholder register'], 'Work performance reports', 'Enterprise environmental factors', 'Organizational process assets'], 379);
	createITTOCard('tools', 'Communication', 'Manage Communications', ['Communication technology', ['Communication skills', 'Communication compentence', 'Feedback', 'Nonverbal', 'Presentations'], 'Communication methods', 'Information management systems', 'Project reporting', ['Interpersonal and team skils', 'Active listening', 'Conflict management', 'Cultural awareness', 'Meeting management', 'Networking', 'Political awareness'], 'Meetings'], 379);
	createITTOCard('outputs', 'Communication', 'Manage Communications', ['Project communications', ['Project management plan updates', 'Communication management plna', 'Stakeholder engagement plan'], ['Project documents updates', 'Issue log', 'Lessons learned register', 'Project schedule', 'Risk register'], 'Organizational process assets updates'], 379);

	createITTOCard('inputs', 'Communication', 'Monitor Communications', [['Project management plan', 'Resource management plan', 'Communication management plan', 'Stakeholder engagement plan'], ['Project documents', 'Lessons learned register', 'Project communications', 'Issue log'], 'Work performance data', 'Organizational process assets', 'Enterprise environmental factors'], 388);
	createITTOCard('tools', 'Communication', 'Monitor Communications', [['Data analysis', 'Stakeholder engagement matrix'], 'Project management information system', 'Expert judgment', ['Interpersonal and team skills', 'Observation/conversation'], 'Meetings'], 388);
	createITTOCard('outputs', 'Communication', 'Monitor Communications', ['Work performance information', 'Change requests', ['Project management plan updates', 'Communication management plan', 'Stakeholder engagement plan'], ['Project documents updates', 'Issue log', 'Lessons learned register', 'Stakeholder register']], 388);


	/* RISK */


	createITTOCard('inputs', 'Risk', 'Plan Risk Management', [['Project management plan', 'All components'], 'Project charter', ['Project documents','Stakeholder register'], 'Enterprise environmental factors', 'Organizational process assets'], 401);
	createITTOCard('tools', 'Risk', 'Plan Risk Management', [['Data analysis', 'Stakeholder analysis'], 'Expert judgment', 'Meetings'], 401);
	createITTOCard('outputs', 'Risk', 'Plan Risk Management', ['Risk management plan'], 401);

	createITTOCard('inputs', 'Risk', 'Identify Risks', [['Project management plan', 'Schedule management plan', 'Risk management plan', 'Cost management plan', 'Schedule management plan', 'Quality management plan', 'Resource management plan', 'Scope baseline', 'Schedule baseline', 'Cost baseline'], ['Project documents', 'Assumption log', 'Cost estimates', 'Duration estimates', 'Issue log', 'Lessons learned register', 'Requirements documentation', 'Stakeholder register'], 'Agreements', 'Procurement documentation', 'Enterprise environmental factors', 'Organizational process assets'], 409);
	createITTOCard('tools', 'Risk', 'Identify Risks', ['Expert judgment', ['Data gathering', 'Brainstorming', 'Checklists', 'Interviews'], ['Data analysis', 'Root cause analysis', 'Assumption and constraint analysis', 'SWOT analysis', 'Document analysis'], ['Interpersonal and team skills', 'Facilitation'], 'Prompt lists', 'Meetings'], 409);
	createITTOCard('outputs', 'Risk', 'Identify Risks', ['Risk register', 'Risk report', ['Project document updates', 'Assumption log', 'Issue log', 'Lessons learned register']], 409);

	createITTOCard('inputs', 'Risk', 'Perform Qualitative Risk Analysis', [['Project management plan', 'Risk management plan'], ['Project documents', 'Assumption log', 'Stakeholder register', 'Risk register'], 'Enterprise environmental factors', 'Organizational process assets'], 419);
	createITTOCard('tools', 'Risk', 'Perform Qualitative Risk Analysis', ['Expert judgment', ['Data gathering', 'Interviews'], ['Data analysis', 'Risk probability and impact assessment', 'Probability and impact matrix', 'Risk data quality assessment'],  ['Interpersonal and team skills', 'Facilitation'], ['Data representation', 'Probability and impact matrix', 'Hierarchical charts'], 'Meetings'], 419);
	createITTOCard('outputs', 'Risk', 'Perform Qualitative Risk Analysis', [['Project documents updates', 'Assumption log', 'Issue log', 'Risk register', 'Risk reports']], 419);

	createITTOCard('inputs', 'Risk', 'Perform Quantitative Risk Analysis', [['Project management plan', 'Risk management plan', 'Scope baseline', 'Schedule baseline', 'Cost baseline'], ['Project documents', 'Assumption log', 'Basis of estimates', 'Cost estimates', 'Cost forecasts', 'Duration estimates', 'Milestone list', 'Resource requirements', 'Risk report', 'Risk register', 'Schedule forecasts'], 'Enterprise environmental factors', 'Organizational process assets'], 428);
	createITTOCard('tools', 'Risk', 'Perform Quantitative Risk Analysis', ['Expert judgment', ['Data gathering', 'Interviews'], ['Interpersonal and team skills', 'Facilitation'], 'Representation of uncertainty', ['Data analysis', 'Simulations', 'Sensitivity analysis', 'Decision tree analysis', 'Influence diagrams']], 428);
	createITTOCard('outputs', 'Risk', 'Perform Quantitative Risk Analysis', [['Project documents updates', 'Risk reports']], 428);

	createITTOCard('inputs', 'Risk', 'Plan Risk Responses', [['Project management plan', 'Resource management plan', 'Risk management plan', 'Cost baseline'], ['Project documents', 'Lessons learned register', 'Project schedule', 'Project team assignments', 'Resource calendars', 'Risk register', 'Risk report', 'Stakeholder register'], 'Enterprise environmental factors', 'Organizational process assets'], 437);
	createITTOCard('tools', 'Risk', 'Plan Risk Responses', ['Expert judgment', ['Data gathering', 'Interviews'], ['Interpersonal and team skills', 'Facilitation'], 'Strategies for threats', 'Strategies for opportunities', 'Contingent response strategies', 'Startagies for overall project risks', ['Data analysis', 'Alternative analysis', 'Cost-benefit analysis'], ['Decision making', 'Multicriteria decision analysis']], 437);
	createITTOCard('outputs', 'Risk', 'Plan Risk Responses', ['Change requests', ['Project management plan updates', 'Schedule management plan', 'Cost management plan', 'Quality management plan', 'Resource management plan', 'Procurement management plan', 'Scope baseline', 'Schedule baseline', 'Cost baseline'], ['Project documents updates', 'Assumption log', 'Cost forecasts', 'Lessons learned register', 'Project schedule', 'Project team assignments', 'Risk register', 'Risk report']], 437);

	createITTOCard('inputs', 'Risk', 'Implement risk responses', [['Project management plan', 'Risk management plan'], ['Project documents', 'Lessons learned register', 'Risk report',  'Risk register'], 'Organizational process assets'], 449);
	createITTOCard('tools', 'Risk', 'Implement risk responses', ['Expert judgment', ['Interpersonal and team skills', 'Influencing'], 'Project management information system'], 449);
	createITTOCard('outputs', 'Risk', 'Implement risk responses', [ 'Change requests', ['Project documents updates', 'Issue log', 'Lessons learned register', 'Project team assignments', 'Risk register', 'Risk report']], 449);

	createITTOCard('inputs', 'Risk', 'Monitor Risks', [['Project management plan', 'Risk management plan'], ['Project documents', 'Issue log',  'Lessons learned register', 'Risk report', 'Risk register'], 'Work performance data', 'Work performance reports'], 453);
	createITTOCard('tools', 'Risk', 'Monitor Risks', [['Data analysis', 'Technical performance analysis', 'Reserve analysis'], 'Audits', 'Meetings'], 453);
	createITTOCard('outputs', 'Risk', 'Monitor Risks', ['Work performance information', 'Change requests', ['Project management plan updates', 'Any component'], ['Project documents updates', 'Assumption log', 'Issue log', 'Lessons learned register', 'Risk report', 'Risk register'], 'Organizational process assets updates'], 453);


	/* PROCUREMENT */


	createITTOCard('inputs', 'Procurement', 'Plan Procurement Management', ['Project charter', ['Business documents', 'Business case', 'Benefits management plan'], ['Project management plan', 'Scope management plan', 'Quality management plan', 'Resource management plan', 'Scope baseline'], ['Project documents', 'Milestone list', 'Requirements documentation', 'Risk register', 'Resource requirements', 'Requirement traceability matrix', 'Project team assignments', 'Stakeholder register'], 'Enterprise environmental factors', 'Organizational process assets'], 466);
	createITTOCard('tools', 'Procurement', 'Plan Procurement Management', [['Data analysis', 'Make-or-buy analysis'], 'Expert judgment', ['Data gathering', 'Market research'], 'Source selection analysis',  'Meetings'], 466);
	createITTOCard('outputs', 'Procurement', 'Plan Procurement Management', ['Procurement management plan', 'Procurement strategy', 'Bid documents', 'Procurement statement of work',  'Source selection criteria', 'Make-or-buy decisions', 'Independent cost estimates', 'Change requests', ['Project documents updates', 'Lessons learned register', 'Milestone list', 'Requirements documentation', 'Requirements traceability matrix', 'Risk register', 'Stakeholder register'], 'Organizational process assets'], 466);

	createITTOCard('inputs', 'Procurement', 'Conduct Procurements', [['Project management plan', 'Scope management plan', 'Requirements management plan', 'Communication management plan', 'Risk management plan', 'Procurement management plan', 'Configuration management plan', 'Cost baseline'], ['Project documents', 'Lessons learned register', 'Project schedule', 'Requirements documentation', 'Risk register', 'Stakeholder register'], 'Procurement documentation', 'Seller proposals', 'Enterprise environmental factors', 'Organizational process assets'], 482);
	createITTOCard('tools', 'Procurement', 'Conduct Procurements', ['Expert judgment', 'Advertising', 'Bidder conferences',['Data analysis', 'Proposal evaluation'], ['Interpersonal and team skills', 'Negotiation']], 482);
	createITTOCard('outputs', 'Procurement', 'Conduct Procurements', ['Selected sellers', 'Agreements', 'Change requests', ['Project management plan updates', 'Requirements management plan', 'Quality management plan', 'Communication management plan', 'Risk management plan', 'Procurement management plan', 'Scope baseline', 'Schedule baseline', 'Cost baseline'], ['Project documents updates', 'Lessons learned register', 'Requirements documentation', 'Requirements traceability matrix', 'Risk register', 'Stakeholder register', 'Resource calendars'], 'Organizational process assets updates'], 482);

	createITTOCard('inputs', 'Procurement', 'Control Procurements', [['Project management plan', 'Requirements management plan', 'Risk management plan', 'Procurement management plan', 'Change management plan', 'Schedule baseline'], ['Project documents', 'Assumption log', 'Lessons learned register', 'Milestone list', 'Quality reports', 'Requirements documentation', 'Requirements traceability matrix', 'Risk register', 'Stakeholder register'], 'Procurement documents', 'Agreements', 'Approved change requests', 'Work performance data', 'Enterprise environmental factors', 'Organizational process assets'], 492);
	createITTOCard('tools', 'Procurement', 'Control Procurements', ['Expert judgment', 'Claims administration', ['Data analysis', 'Performance reviewa', 'Earned value analysis', 'Trend analysis'], 'Inspection', 'Audits'], 492);
 	createITTOCard('outputs', 'Procurement', 'Control Procurements', ['Closed procurements', 'Work performance information', 'Procurement documentation updates', 'Change requests', ['Project management plan updates', 'Risk management plan', 'Procurement management plan', 'Schedule baseline', 'Cost baseline'], ['Project documents updates', 'Lessons learned register', 'Resource requirements', 'Requirements traceability matrix', 'Risk register', 'Stakeholder register'], 'Organizational process assets updates'], 492);


	/* STAKEHOLDER */


	createITTOCard('inputs', 'Stakeholder', 'Identify Stakeholders', ['Project charter', ['Business documentation', 'Business case', 'Benefits management plan'], ['Project management plan', 'Communications management plan', 'Stakeholder engagement plan'],  ['Project documents', 'Change log', 'Issue log', 'Requirements documentation'], 'Agreements', 'Enterprise environmental factors', 'Organizational process assets'], 507);
	createITTOCard('tools', 'Stakeholder', 'Identify Stakeholders', [['Data gathering', 'Questionnaires and surveys', 'Brainstorming'], ['Data analysis','Stakeholder analysis', 'Document analysis'], 'Expert judgment', ['Data representation', 'Stakeholder mapping/representation'], 'Meetings'], 507);
	createITTOCard('outputs', 'Stakeholder', 'Identify Stakeholders', ['Stakeholder register', 'Change requests', ['Project management plan updates', 'Requirements management plan', 'Communications management plan', 'Risk management plan', 'Stakeholder engagement plan'], ['Project documents updates', 'Assumption log', 'Issue log', 'Risk register']], 507);

	createITTOCard('inputs', 'Stakeholder', 'Plan Stakeholder Engagement', ['Project charter', ['Project management plan', 'Resource management plan', 'Communication management plan', 'Risk management plan'], ['Project documents', 'Assumption log', 'Issue log', 'Project schedule', 'Risk register', 'Stakeholder register'], 'Agreements', 'Enterprise environmental factors', 'Organizational process assets'], 516);
	createITTOCard('tools', 'Stakeholder', 'Plan Stakeholder Engagement', ['Expert judgment', 'Meetings', ['Data gathering', 'Benchmarking'], ['Data analysis', 'Assumption and constraint analysis', 'Root cause analysis'], ['Decision making', 'Prioritization/Ranking'], ['Data representation', 'Mind mapping', 'Stakeholder engagement assessment matrix']], 516);
	createITTOCard('outputs', 'Stakeholder', 'Plan Stakeholder Engagement', ['Stakeholder engagement plan'], 516);

	createITTOCard('inputs', 'Stakeholder', 'Manage Stakeholder Engagement', [['Project management plan', 'Risk management plan', 'Change management plan', 'Stakeholder engagement plan', 'Communications management plan'], ['Project documents', 'Issue log', 'Change log', 'Lessons learned register', 'Stakeholder register'], 'Organizational process assets', 'Enterprise environmental factors'], 523);
	createITTOCard('tools', 'Stakeholder', 'Manage Stakeholder Engagement', ['Expert judgement', ['Communication skills', 'Feedback'], ['Interpersonal and team skills', 'Conflict management', 'Cultural awareness', 'Negotiation', 'Observation/conversation', 'Political awareness'], 'Ground rules', 'Meetings'], 523);
	createITTOCard('outputs', 'Stakeholder', 'Manage Stakeholder Engagement', ['Change requests',[ 'Project management plan updates', 'Communications management plan', 'Stakeholder engagement plan'], ['Project documents updates', 'Change log', 'Issue log', 'Lessons learned register', 'Stakeholder register']], 523);

	createITTOCard('inputs', 'Stakeholder', 'Monitor Stakeholder Engagement', [['Project management plan', 'Resource management plan', 'Communications management plan', 'Stakeholder engagement plan'], ['Project documents', 'Issue log', 'Lessons learned register', 'Project communications', 'Risk register', 'Stakeholder register'], 'Work performance data', 'Enterprise environmental factors', 'Organizational process assets'], 530);
	createITTOCard('tools', 'Stakeholder', 'Monitor Stakeholder Engagement', [['Data analysis', 'Alternative analysis', 'Root cause analysis', 'Stakeholder analysis'], ['Decision making', 'Multicriteria decision analysis', 'Voting'], ['Data representation', 'Stakeholder engagement assessment matrix'], ['Communication skills', 'Feedback', 'Presentations'], ['Interpersonal and team skills', 'Active listening', 'Cultural awareness', 'Leadership', 'Networking', 'Political awareness'], 'Meetings'], 530);
	createITTOCard('outputs', 'Stakeholder', 'Monitor Stakeholder Engagement', ['Work performance information', 'Change requests', ['Project management plan updates', 'Resource management plan', 'Communication management plan', 'Stakeholder engagement plan'], ['Project documents updates', 'Issue log', 'Lessons learned register', 'Risk register', 'Stakeholder register']], 530);


}










