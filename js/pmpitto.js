"use strict";

var CURRENT_VERSION = '0.0.9';


var lastClickedObject = null;
var currentDeck = [];
var currentEvaluationTags = [];
var NB_QUESTION_PER_ROUND = 10;
var cuurentQuestionNb = 0;

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

	localStorage.setItem(app_id + ".version", CURRENT_VERSION);
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
			applyTheme($("select#theme-popover-combo").val());
			$("div#theme-popover").addClass("ui-screen-hidden");
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

	

	if (lastClickedObject.is("a.icon.icon-bars.pull-left"))
	{
		backHome();
	}
	else if (lastClickedObject.is("a.ui-collapsible-heading-toggle.ui-btn.ui-icon-plus.ui-btn-icon-left.ui-btn-inherit"))
	{
		currentEvaluationTags = [$(lastClickedObject).data("source")];
		startEvaluation();
	}
	else if (lastClickedObject.is("div.card-tag-caption"))
	{
		currentEvaluationTags = [$(lastClickedObject).data("source")];
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

	cuurentQuestionNb = 0;

	var cardCollec = new CardCollection(currentEvaluationTags);
	currentDeck = cardCollec.getCards(NB_QUESTION_PER_ROUND);

	if (currentDeck.length !== 0)
	{
		var card = currentDeck[0];
		$('#project-calendar').html(htmlFromCard(card));
	}


}

function nextQuestion()
{
	cuurentQuestionNb++;
	if (cuurentQuestionNb ===  NB_QUESTION_PER_ROUND || cuurentQuestionNb === currentDeck.length )
	{
		startEvaluation();
	}

	var card = currentDeck[cuurentQuestionNb];

	$('.task-card').addClass('swipedOutCard');


	setTimeout(
		function() { 
				$('.swipedOutCard').remove();
				saveAll();
			 }
	, 1000);

	setTimeout(
		function() { 
				$('#project-calendar').prepend(htmlFromCard(card));
			}
	, 5);
	
}



function create()
{
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
			this.addTag('pmbok 5th Ed');
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

	return result;
}



function compareCards(a, b)
{
	if (b.getBucketIndex() > a.getBucketIndex()) { return -1; }
	if (a.getBucketIndex() > b.getBucketIndex()) { return 1; }
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


}



function createITTOCard(type, caption, processCaption, versoList, pageNb)
{
	var typeStr = (type === 'inputs') ? 'inputs' : ((type === 'outputs') ? 'outputs' : 'tools & techniques');
	var q = 'Please provide the **' + typeStr + '** for the **' + processCaption + '** process found in the **' + caption + ' management** knowledge area of the PMBOK (Project Management Body Of Knowledge 5th Edition - p'+ pageNb.toString() +').';
	var answer = '####' + processCaption + '####\n\nThe **' + typeStr + '** for the **' + processCaption + '** process are {0}';


	var l = '\n\n';
	for (var i = 0; i < versoList.length; i++)
	{
		l += (i + 1).toString() + '.  ' + versoList[i] + '\n' ;
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


	return String.format(
		html,
		card.id(),
		card.getCaption(),
		markdown.toHTML(card.getRecto()),
		htmlFromTags(card),
		card.getTags()[1],
		card.getImage(),
		cardScore[card._lastBucketIndex].toString(),
		scoreLabel[card._lastBucketIndex]
	);
}



function createPMBOKProcesses()
{

	/* INTEGRATION */

	createITTOCard('inputs', 'Integration', 'Develop Project Charter', ['Project statement of work', 'Business case', 'Agreements', 'Enterprise environmental factors', 'Organizational process assets'], 66);
	createITTOCard('tools', 'Integration', 'Develop Project Charter', ['Expert judgment', 'Facilitation techniques'], 66);
	createITTOCard('outputs', 'Integration', 'Develop Project Charter', ['Project charter'], 66);

	createITTOCard('inputs', 'Integration', 'Develop Project Management Plan', ['Project charter', 'Outputs from other processes', 'Enterprise environmental factors', 'Organizational process assets'], 72);
	createITTOCard('tools', 'Integration', 'Develop Project Management Plan', ['Expert judgment', 'Facilitation techniques'], 72);
	createITTOCard('outputs', 'Integration', 'Develop Project Management Plan', ['Project management plan'], 72);


	createITTOCard('inputs', 'Integration', 'Direct and Manage Project Work', ['Project management plan', 'Approved change requests', 'Enterprise environmental factors', 'Organizational process assets'], 79);
	createITTOCard('tools', 'Integration', 'Direct and Manage Project Work', ['Expert judgment', 'Project management information system', 'Meetings'], 79);
	createITTOCard('outputs', 'Integration', 'Direct and Manage Project Work', ['Deliverables', 'Work performance data', 'Change requests', 'Project management plan updates', 'Project documents updates'], 79);


	createITTOCard('inputs', 'Integration', 'Monitor and Control Project Work', ['Project management plan', 'Schedule forecasts', 'Cost forecasts', 'Validated changes', 'Work performance information', 'Enterprise environmental factors', 'Organizational process assets'], 86);
	createITTOCard('tools', 'Integration', 'Monitor and Control Project Work', ['Expert judgment', 'Analytical techniques', 'Project management information system', 'Meetings'], 86);
	createITTOCard('outputs', 'Integration', 'Monitor and Control Project Work', ['Change requests', 'Work performance reports', 'Project management plan updates', 'Project documents updates'], 86);

	createITTOCard('inputs', 'Integration', 'Perform Integrated Change Control', ['Project management plan', 'Work performance reports', 'Change requests', 'Enterprise environmental factors', 'Organizational process assets'], 94);
	createITTOCard('tools', 'Integration', 'Perform Integrated Change Control', ['Expert judgment', 'Meetings', 'Change control tools'], 94);
	createITTOCard('outputs', 'Integration', 'Perform Integrated Change Control', ['Approved change requests', 'Change log', 'Project management plan updates', 'Project documents updates'], 94);

	createITTOCard('inputs', 'Integration', 'Close Project or Phase', ['Project management plan', 'Accepted deliverables', 'Organizational process assets'], 100);
	createITTOCard('tools', 'Integration', 'Close Project or Phase', ['Expert judgment', 'Analytical techniques', 'Meetings'], 100);
	createITTOCard('outputs', 'Integration', 'Close Project or Phase', ['Final product, service, or result transition', 'Organizational process assets updates'], 100);


	/* SCOPE */

	
	createITTOCard('inputs', 'Scope', 'plan scope management', ['Project management plan','Project charter','Enterprise environmental factors','Organizational process assets'], 106);
	createITTOCard('tools', 'Scope', 'plan scope management', ['Expert judgment','Meetings'], 106);
	createITTOCard('outputs', 'Scope', 'plan scope management', ['Scope management plan','Requirements management plan'], 106);

	createITTOCard('inputs', 'Scope', 'collect requirements', ['Scope management plan','Requirements management plan','Stakeholder management plan','Project charter','Stakeholder register'], 110);
	createITTOCard('tools', 'Scope', 'collect requirements', ['Interviews','Focus groups','Facilitated workshops','Group creativity techniques','Group decision-making techniques','Questionnaires and surveys','Observations','Prototypes','Benchmarking','Context diagrams','Document analysis'], 110);
	createITTOCard('outputs', 'Scope', 'collect requirements', ['Requirements documentation','Requirements traceability matrix'], 110);

	createITTOCard('inputs', 'Scope', 'define Scope', ['Scope management plan','Project charter','Requirements documentation','Organizational process assets'], 120);
	createITTOCard('tools', 'Scope', 'define Scope', ['Expert judgment','Product analysis','Alternatives generation','Facilitated workshops'], 120);
	createITTOCard('outputs', 'Scope', 'define Scope', ['Project scope statement','Project documents updates'], 120);

	createITTOCard('inputs', 'Scope', 'create WBS', ['Scope management plan','Project scope statement','Requirements documentation','Enterprise environmental factors','Organizational process assets'], 125);
	createITTOCard('tools', 'Scope', 'create WBS', ['Decomposition','Expert judgment'], 125);
	createITTOCard('outputs', 'Scope', 'create WBS', ['Scope baseline','Project documents updates'], 125);

	createITTOCard('inputs', 'Scope', 'Validate Scope', ['Project management plan','Requirements documentation','Requirements traceability matrix','Verified deliverables','Work performance data'], 133);
	createITTOCard('tools', 'Scope', 'Validate Scope', ['Inspection','Group decision-making techniques'], 133);
	createITTOCard('outputs', 'Scope', 'Validate Scope', ['Accepted deliverables','Change requests','Work performance information','Project documents updates'], 133);

	createITTOCard('inputs', 'Scope', 'control Scope', ['Project management plan','Requirements documentation','Requirements traceability matrix','Work performance data','Organizational process assets'], 136);
	createITTOCard('tools', 'Scope', 'control Scope', ['Variance analysis'], 136);
	createITTOCard('outputs', 'Scope', 'control Scope', ['Work performance information','Change requests','Project management plan updates','Project documents updates','Organizational process assets updates'], 136);


	/*TIME */
	createITTOCard('inputs', 'Time', 'Plan Schedule Management', ['Project management plan','Project charter','Enterprise environmental factors','Organizational process assets'], 145);
	createITTOCard('tools', 'Time', 'Plan Schedule Management', ['Expert judgment','Analytical techniques', 'Meetings'], 145);
	createITTOCard('outputs', 'Time', 'Plan Schedule Management', ['Schedule management plan'], 145);


	createITTOCard('inputs', 'Time', 'define Activities', ['Schedule management plan','Scope baseline','Enterprise environmental factors','Organizational process assets'], 149);
	createITTOCard('tools', 'Time', 'define Activities', ['Decomposition','Rolling wave planning','Expert judgment'], 149);
	createITTOCard('outputs', 'Time', 'define Activities', ['Activity list','Activity attributes','Milestone list'], 149);

	createITTOCard('inputs', 'Time', 'Sequence Activities', [' Schedule management plan','Activity list','Activity attributes','Milestone list','Project scope statement','Enterprise environmental factors','Organizational process assets'], 153);
	createITTOCard('tools', 'Time', 'Sequence Activities', ['Precedence diagramming method (PDM)','Dependency determination','Leads and lags'], 153);
	createITTOCard('outputs', 'Time', 'Sequence Activities', ['Project schedule network diagrams','Project documents updates'], 153);

	createITTOCard('inputs', 'Time', 'Estimate Activity resources', ['Schedule management plan','Activity list','Activity attributes','Resource calendars','Risk register','Activity cost estimates','Enterprise environmental factors','Organizational process assets'], 160);
	createITTOCard('tools', 'Time', 'Estimate Activity resources', ['Expert judgment','Alternative analysis','Published estimating data','Bottom-up estimating','Project management software'], 160);
	createITTOCard('outputs', 'Time', 'Estimate Activity resources', ['Activity resource requirements','Resource breakdown structure','Project documents updates'], 160);

	createITTOCard('inputs', 'Time', 'Estimate Activity durations', ['Schedule management plan','Activity list','Activity attributes','Activity resource requirements','Resource calendars','Project scope statement','Risk register','Resource breakdown structure','Enterprise environmental factors','Organizational process assets'], 165);
	createITTOCard('tools', 'Time', 'Estimate Activity durations', ['Expert judgment','Analogous estimating','Parametric estimating','Three-point estimating','Group decision-making techniques','Reserve analysis'], 165);
	createITTOCard('outputs', 'Time', 'Estimate Activity durations', ['Activity duration estimate','Project documents updates'], 165);

	createITTOCard('inputs', 'Time', 'develop Schedule', ['Schedule management plan','Activity list','Activity attributes','Project schedule network diagrams','Activity resource requirements','Resource calendars','Activity duration estimates','Project scope statement','Risk register','Project staff assignments','Resource breakdown structure','Enterprise environmental factors','Organizational process assets'], 172);
	createITTOCard('tools', 'Time', 'develop Schedule', ['Schedule network analysis','Critical path method','Critical chain method','Resource optimization techniques','Modeling techniques','Leads and lags','Schedule compression','Scheduling tool'], 172);
	createITTOCard('outputs', 'Time', 'develop Schedule', ['Schedule baseline','Project schedule','Schedule data','Project calendars','Project management plan updates','Project documents updates'], 172);

	
	createITTOCard('inputs', 'Time', 'control Schedule', ['Project management plan','Project schedule','Work performance data','Project calendars','Schedule data','Organizational process assets'], 185);
	createITTOCard('tools', 'Time', 'control Schedule', ['Performance reviews','Project management software','Resource optimization techniques','Modeling techniques','Leads and lags','Schedule compression','Scheduling tool'], 185);
	createITTOCard('outputs', 'Time', 'control Schedule', ['Work performance information', 'Schedule forecasts', 'Change requests','Project management plan updates','Project documents updates','Organizational process assets updates'], 185);


	/* COST */
	
	createITTOCard('inputs', 'Cost', 'Plan Cost Management', ['Project management plan','Project charter','Enterprise environmental factors','Organizational process assets'], 185);
	createITTOCard('tools', 'Cost', 'Plan Cost Management', ['Expert judgment','Analytical techniques','Meetings'], 185);
	createITTOCard('outputs', 'Cost', 'Plan Cost Management', ['Cost management plan'], 185);

	createITTOCard('inputs', 'Cost', 'Estimate Costs', ['Cost management plan','Human resource management plan','Scope baseline','Project schedule','Risk register','Enterprise environmental factors','Organizational process assets'], 200);
	createITTOCard('tools', 'Cost', 'Estimate Costs', ['Expert judgment', 'Analogous estimating', 'Parametric estimating', 'Bottom-up estimating', 'Three-point estimating', 'Reserve analysis', 'Cost of quality', 'Project management software', 'Vendor bid analysis', 'Group decision-making techniques'], 200);
	createITTOCard('outputs', 'Cost', 'Estimate Costs', ['Activity cost estimates','Basis of estimates','Project documents updates'], 200);

	createITTOCard('inputs', 'Cost', 'Determine Budget', ['Cost management plan', 'Scope baseline', 'Activity cost estimates', 'Basis of estimates', 'Project schedule', 'Resource calendars', 'Risk register', 'Agreements', 'Organizational process assets'], 208);
	createITTOCard('tools', 'Cost', 'Determine Budget', ['Cost aggregation', 'Reserve analysis', 'Expert judgment', 'Historical relationships' ,'Funding limit reconciliation'], 208);
	createITTOCard('outputs', 'Cost', 'Determine Budget', ['Cost baseline', 'Project funding requirements', 'Project documents updates'], 208);

	createITTOCard('inputs', 'Cost', 'Control Cost', ['Project management plan', 'Project funding requirements', 'Work performance data', 'Organizational process assets'], 215);
	createITTOCard('tools', 'Cost', 'Control Cost', ['Earned value management', 'Forecasting', 'To-complete performance index (TCPI)', 'Performance reviews', 'Project management software', 'Reserve analysis'], 215);
	createITTOCard('outputs', 'Cost', 'Control Cost', ['Work performance information', 'Cost forecasts', 'Change requests','Project management plan updates','Project documents updates','Organizational process assets updates'], 215);


	/* QUALITY */
	
	createITTOCard('inputs', 'Quality', 'Plan Quality Management', ['Project management plan', 'Stakeholder register', 'Risk register', 'Requirements documentation', 'Enterprise environmental factors', 'Organizational process assets'], 231);
	createITTOCard('tools', 'Quality', 'Plan Quality Management', ['Cost-benefit analysis', 'Cost of quality', 'Seven basic quality tools', 'Benchmarking', 'Design of experiments', 'Statistical sampling', 'Additional quality planning tools', 'Meetings'], 231);
	createITTOCard('outputs', 'Quality', 'Plan Quality Management', ['Quality management plan', 'Process improvement plan', 'Quality metrics', 'Quality checklists', 'Project documents updates'], 231);

	createITTOCard('inputs', 'Quality', 'Perform Quality Assurance', ['Quality management plan', 'Process improvement plan', 'Quality metrics', 'Quality control measurements', 'Project documents'], 242);
	createITTOCard('tools', 'Quality', 'Perform Quality Assurance', ['Quality management and control tools', 'Quality audits', 'Process analysis'], 242);
	createITTOCard('outputs', 'Quality', 'Perform Quality Assurance', ['Change requests', 'Project management plan updates', 'Project documents updates', 'Organizational process assets updates'], 242);

	createITTOCard('inputs', 'Quality', 'Control Quality', ['Project management plan', 'Quality metrics', 'Quality checklists', 'Work performance data', 'Approved change requests', 'Deliverables', 'Project documents', 'Organizational process assets'], 248);
	createITTOCard('tools', 'Quality', 'Control Quality', ['Seven basic quality tools', 'Statistical sampling', 'Inspection', 'Approved change requests review'], 248);
	createITTOCard('outputs', 'Quality', 'Control Quality', ['Quality control measurements', 'Validated changes', 'Verified deliverables', 'Work performance information ', 'Change requests ', 'Project management plan updates', 'Project documents updates', 'Organizational process assets updates'], 248);

	/* HUMAN RESOURCES */
	
	createITTOCard('inputs', 'HR', 'Plan Human Resource Management', ['Project management plan', 'Activity resource requirements', 'Enterprise environmental factors', 'Organizational process assets'], 258);
	createITTOCard('tools', 'HR', 'Plan Human Resource Management', ['Organization charts and position descriptions', 'Networking', 'Organizational theory', 'Expert judgment', 'Meetings'], 258);
	createITTOCard('outputs', 'HR', 'Plan Human Resource Management', ['Human resource management plan'], 258);
	createITTOCard('inputs', 'HR', 'Acquire Project Team', ['Human resource management plan', 'Enterprise environmental factors', 'Organizational process assets'], 267);
	createITTOCard('tools', 'HR', 'Acquire Project Team', ['Pre-assignment', 'Negotiation', 'Acquisition', 'Virtual teams', 'Multi-criteria decision analysis'], 267);
	createITTOCard('outputs', 'HR', 'Acquire Project Team', ['Project staff assignments', 'Resource calendars', 'Project management plan updates'], 267);

	createITTOCard('inputs', 'HR', 'Develop Project Team', ['Human resource management plan', 'Project staff assignments', 'Resource calendars'], 273);
	createITTOCard('tools', 'HR', 'Develop Project Team', ['Interpersonal skills', 'Training', 'Team-building activities', 'Ground rules', 'Colocation', 'Recognition and rewards', 'Personnel assessment tools'], 273);
	createITTOCard('outputs', 'HR', 'Develop Project Team', ['Team performance assessments', 'Enterprise environmental factors updates'], 273);

	createITTOCard('inputs', 'HR', 'Manage Project Team', ['Human resource management plan', 'Project staff assignments', 'Team performance assessments', 'Issue log', 'Work performance reports', 'Organizational process assets'], 279);
	createITTOCard('tools', 'HR', 'Manage Project Team', ['Observation and conversation', 'Project performance appraisals', 'Conflict management', 'Interpersonal skills'], 279);
	createITTOCard('outputs', 'HR', 'Manage Project Team', ['Change requests', 'Project management plan updates', 'Project documents updates', 'Enterprise environmental factors updates', 'Organizational process assets updates'], 279);

	/* COMMUNICATION */
	
	createITTOCard('inputs', 'Communication', 'Plan Communications Management', ['Project management plan', 'Stakeholder register', 'Enterprise environmental factors', 'Organizational process assets'], 289);
	createITTOCard('tools', 'Communication', 'Plan Communications Management', ['Communication requirements analysis', 'Communication technology', 'Communication models', 'Communication methods', 'Meetings'], 289);
	createITTOCard('outputs', 'Communication', 'Plan Communications Management', ['Communications management plan', 'Project documents updates'], 289);

	createITTOCard('inputs', 'Communication', 'Manage Communications', ['Communications management plan', 'Work performance reports', 'Enterprise environmental factors', 'Organizational process assets'], 297);
	createITTOCard('tools', 'Communication', 'Manage Communications', ['Communication technology', 'Communication models', 'Communication methods', 'Information management systems', 'Performance reporting'], 297);
	createITTOCard('outputs', 'Communication', 'Manage Communications', ['Project communications', 'Project management plan updates', 'Project documents updates', 'Organizational process assets updates'], 297);

	createITTOCard('inputs', 'Communication', 'Control Communications', ['Project management plan', 'Project communications', 'Issue log', 'Work performance data', 'Organizational process assets'], 303);
	createITTOCard('tools', 'Communication', 'Control Communications', ['Information management systems', 'Expert judgment', 'Meetings'], 303);
	createITTOCard('outputs', 'Communication', 'Control Communications', ['Work performance information', 'Change requests', 'Project management plan updates', 'Project documents updates', 'Organizational process assets updates'], 303);


	/* RISK */


	createITTOCard('inputs', 'Risk', 'Plan Risk Management', ['Project management plan', 'Project charter', 'Stakeholder register', 'Enterprise environmental factors', 'Organizational process assets'], 313);
	createITTOCard('tools', 'Risk', 'Plan Risk Management', ['Analytical techniques', 'Expert judgment', 'Meetings'], 313);
	createITTOCard('outputs', 'Risk', 'Plan Risk Management', ['Risk management plan'], 313);

	createITTOCard('inputs', 'Risk', 'Identify Risks', ['Risk management plan', 'Cost management plan', 'Schedule management plan', 'Quality management plan', 'Human resource management plan', 'Scope baseline', 'Activity cost estimates', 'Activity duration estimates', 'Stakeholder register', 'Project documents', 'Procurement documents', 'Enterprise environmental factors', 'Organizational process assets'], 319);
	createITTOCard('tools', 'Risk', 'Identify Risks', ['Documentation reviews', 'Information gathering techniques', 'Checklist analysis', 'Assumptions analysis', 'Diagramming techniques', 'SWOT analysis', 'Expert judgment'], 319);
	createITTOCard('outputs', 'Risk', 'Identify Risks', ['Risk register'], 319);

	createITTOCard('inputs', 'Risk', 'Perform Qualitative Risk Analysis', ['Risk management plan', 'Scope baseline', 'Risk register', 'Enterprise environmental factors', 'Organizational process assets'], 328);
	createITTOCard('tools', 'Risk', 'Perform Qualitative Risk Analysis', ['Risk probability and impact assessment', 'Probability and impact matrix', 'Risk data quality assessment', 'Risk categorization', 'Risk urgency assessment', 'Expert judgment'], 328);
	createITTOCard('outputs', 'Risk', 'Perform Qualitative Risk Analysis', ['Project documents updates'], 328);

	createITTOCard('inputs', 'Risk', 'Perform Quantitative Risk Analysis', ['Risk management plan', 'Cost management plan', 'Schedule management plan', 'Risk register', 'Enterprise environmental factors', 'Organizational process assets'], 333);
	createITTOCard('tools', 'Risk', 'Perform Quantitative Risk Analysis', ['Data gathering and representation techniques', 'Quantitative risk analysis and modeling techniques', 'Expert judgment'], 333);
	createITTOCard('outputs', 'Risk', 'Perform Quantitative Risk Analysis', ['Project documents updates'], 333);

	createITTOCard('inputs', 'Risk', 'Plan Risk Responses', ['Risk management plan', 'Risk register'], 342);
	createITTOCard('tools', 'Risk', 'Plan Risk Responses', ['Strategies for negative risks or threats', 'Strategies for positive risks or opportunities', 'Contingent response strategies', 'Expert judgment'], 342);
	createITTOCard('outputs', 'Risk', 'Plan Risk Responses', ['Project management plan updates', 'Project documents updates'], 342);

	createITTOCard('inputs', 'Risk', 'Control Risks', ['Project management plan', 'Risk register', 'Work performance data', 'Work performance reports'], 349);
	createITTOCard('tools', 'Risk', 'Control Risks', ['Risk reassessment', 'Risk audits', 'Variance and trend analysis', 'Technical performance measurement', 'Reserve analysis', 'Meetings'], 349);
	createITTOCard('outputs', 'Risk', 'Control Risks', ['Work performance information', 'Change requests', 'Project management plan updates', 'Project documents updates', 'Organizational process assets updates'], 349);


	/* PROCUREMENT */


	createITTOCard('inputs', 'Procurement', 'Plan Procurement Management', ['Project management plan', 'Requirements documentation', 'Risk register', 'Activity resource requirements', 'Project schedule', 'Activity cost estimates', 'Stakeholder register', 'Enterprise environmental factors', 'Organizational process assets'], 358);
	createITTOCard('tools', 'Procurement', 'Plan Procurement Management', ['Make-or-buy analysis', 'Expert judgment', 'Market research', 'Meetings'], 358);
	createITTOCard('outputs', 'Procurement', 'Plan Procurement Management', ['Procurement management plan', 'Procurement statement of work', 'Procurement documents', 'Source selection criteria', 'Make-or-buy decisions', 'Change requests', 'Project documents updates'], 358);

	createITTOCard('inputs', 'Procurement', 'Conduct Procurements', ['Procurement management plan','Procurement documents', 'Source selection criteria', 'Seller proposals', 'Project documents', 'Make-or-buy decisions', 'Procurement statement of work', 'Organizational process assets'], 378);
	createITTOCard('tools', 'Procurement', 'Conduct Procurements', ['Bidder conference', 'Proposal evaluation techniques', 'Independent estimates', 'Expert judgment', 'Advertising', 'Analytical techniques', 'Procurement negotiations'], 378);
	createITTOCard('outputs', 'Procurement', 'Conduct Procurements', ['Selected sellers', 'Agreements', 'Resource calendars', 'Change requests', 'Project management plan updates', 'Project documents updates'], 378);

	createITTOCard('inputs', 'Procurement', 'Control Procurements', ['Project management plan', 'Procurement documents', 'Agreements', 'Approved change requests', 'Work performance reports', 'Work performance data'], 379);
	createITTOCard('tools', 'Procurement', 'Control Procurements', ['Contract change control system', 'Procurement performance reviews', 'Inspections and audits', 'Performance reporting', 'Payment systems', 'Claims administration', 'Records management'], 379);
 	createITTOCard('outputs', 'Procurement', 'Control Procurements', ['Work performance information', 'Change requests', 'Project management plan updates', 'Project documents updates', 'Organizational process assets updates'], 379);

	createITTOCard('inputs', 'Procurement', 'Close Procurements', ['Project management plan', 'Procurement documents'], 386);
	createITTOCard('tools', 'Procurement', 'Close Procurements', ['Procurement audits', 'Procurement negotiations', 'Records management system'], 386);
	createITTOCard('outputs', 'Procurement', 'Close Procurements', ['Closed procurements', 'Organizational process assets updates'], 386);



	/* STAKEHOLDER */


	createITTOCard('inputs', 'Stakeholder', 'Identify Stakeholders', ['Project charter', 'Procurement documents', 'Enterprise environmental factors', 'Organizational process assets'], 393);
	createITTOCard('tools', 'Stakeholder', 'Identify Stakeholders', ['Stakeholder analysis', 'Expert judgment', 'Meetings'], 393);
	createITTOCard('outputs', 'Stakeholder', 'Identify Stakeholders', ['Stakeholder register'], 393);

	createITTOCard('inputs', 'Stakeholder', 'Plan Stakeholder Management', ['Project management plan', 'Stakeholder register', 'Enterprise environmental factors', 'Organizational process assets'], 399);
	createITTOCard('tools', 'Stakeholder', 'Plan Stakeholder Management', ['Expert judgment', 'Meetings', 'Analytical techniques'], 399);
	createITTOCard('outputs', 'Stakeholder', 'Plan Stakeholder Management', ['Stakeholder management plan', 'Project documents updates'], 399);

	createITTOCard('inputs', 'Stakeholder', 'Manage Stakeholder Engagement', ['Stakeholder management plan', 'Communications management plan', 'Change log', 'Organizational process assets'], 404);
	createITTOCard('tools', 'Stakeholder', 'Manage Stakeholder Engagement', ['Communication methods', 'Interpersonal skills', 'Management skills'], 404);
	createITTOCard('outputs', 'Stakeholder', 'Manage Stakeholder Engagement', ['Issue log', 'Change requests', 'Project management plan updates', 'Project documents updates', 'Organizational process assets updates'], 404);

	createITTOCard('inputs', 'Stakeholder', 'Control Stakeholder Engagement', ['Project management plan', 'Issue log', 'Work performance data', 'Project documents'], 409);
	createITTOCard('tools', 'Stakeholder', 'Control Stakeholder Engagement', ['Information management systems', 'Expert judgment', 'Meetings'], 409);
	createITTOCard('outputs', 'Stakeholder', 'Control Stakeholder Engagement', ['Work performance information', 'Change requests', 'Project management plan updates', 'Project documents updates', 'Organizational process assets updates'], 409);


}








