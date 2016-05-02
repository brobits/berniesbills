
var q = require("q");
var md = require("markdown");
var markdown = md.markdown;
var jquery = require("jquery");
var toastr = require("toastr");

var CARD_WIDTH = 450;
var TRUNCATE_SUMMARY_AT = 700;
var TRUNCATE_NAME_AT = 60;
var WORD_PEEK = 15;
var MEMBERS_PER_BILL = 10;
var SCROLL_TOAST_TRIGGER = 800;
var VOLUNTEER_URI = "https://go.berniesanders.com/page/s/volunteer-for-bernie";
var PHONEBANK_URI = "https://go.berniesanders.com/page/content/phonebank";
var CONTRIBUTE_URI = "https://secure.actblue.com/contribute/page/lets-go-bernie";

var committees = {};
var bills = {};
var senators = {};
var toasted = false;

$(document).scroll(function(env) {
  var scrollHeight = $(document).scrollTop();
  if (scrollHeight > SCROLL_TOAST_TRIGGER && !toasted) {
    toasted = true;
    var opts = {timeOut: 10000, progressBar: true};
    var contribute = "<a href='" + CONTRIBUTE_URI + "' class='toast btn btn-success'><i class='glyphicon glyphicon-piggy-bank'></i> Contribute</a>";
    var volunteer = "<a href='" + VOLUNTEER_URI + "' class='toast btn btn-danger'><i class='glyphicon glyphicon-heart'></i> Volunteer</a>";
    var phonebank = "<a href='" + PHONEBANK_URI + "' class='toast btn btn-warning'><i class='glyphicon glyphicon-phone'></i> Phonebank</a>";
    toastr.info(volunteer + phonebank + contribute, 'Get involved with the campaign!', opts)
  }
});

var formatBillIndex = function(index) {
  var billIndex = 's' + formatBillNumber(index);
  return billIndex;
}

var formatBillNumber = function(number) {
  if (number.length > 2) {
    return number.substring(2, number.length);
  }
  return number;
}

var inverseBillIndex = function(formatted) {
  return 'S.' + formatted.substring(1, formatted.length);
}

var formatBillName = function(name) {
  if (name.length > TRUNCATE_NAME_AT) {
    var index = name.substring(TRUNCATE_NAME_AT-WORD_PEEK, name.length).indexOf(' ');
    if (index >= 0) index = index + TRUNCATE_NAME_AT-WORD_PEEK; else index = TRUNCATE_NAME_AT;
    return name.substring(0, index) + "...";
  }
  return name;
}

var formatSummary = function(summary) {
  if (summary.length > TRUNCATE_SUMMARY_AT) {
    var index = summary.substring(TRUNCATE_SUMMARY_AT-WORD_PEEK, summary.length).indexOf(' ');
    if (index >= 0) index = index + TRUNCATE_SUMMARY_AT-WORD_PEEK; else index = TRUNCATE_SUMMARY_AT;
    return summary.substring(0, index) + "...";
  } else return summary;
}

var isSummaryTruncated = function(summary) {
  return summary.length > TRUNCATE_SUMMARY_AT;
}

var populateBill = function(bill) {
  bills[bill.index] = bill;
}

// manually selected bills for the top of the page
var preferredBills = {
  's2054': 1, // justice not for sale
  's1206': 2, // too big to fail
  'sjres4': 3, // citizens united
  's1832': 4, // minimum wage
  's1564': 5, // paid vacations
  's1373': 6, // college for all
  's268': 7, // rebuild america
  's2399': 8, // climate change
  's2391': 9, // clean energy act
  's2398': 10, // clean energy jobs act
  's2399': 11, // climate protection,
  's1364': 12 // medicaid drug prices
};

// autosort bills by weight
var sortBills = function(billNames) {
  billNames.sort(function(a, b) {
    var aWeight = 0;
    var bWeight = 0;
    var aBill = bills[a];
    var bBill = bills[b];
    var aName = a.replace('.', '').toLowerCase();
    var bName = b.replace('.', '').toLowerCase();
    if (preferredBills[aName] != null) {
      var order = Object.keys(preferredBills).length + 2 - preferredBills[aName];
      aWeight = order * 100000;
    }
    if (preferredBills[bName] != null) {
      var order = Object.keys(preferredBills).length + 2 - preferredBills[bName];
      bWeight = order * 100000;
    }
    if (aBill.bernie != null) {
      aWeight = aWeight + 1000;
    }
    if (bBill.bernie != null) {
      bWeight = bWeight + 1000;
    }
    if (aBill.summary != null) {
      aWeight = aWeight + aBill.summary.length;
    }
    if (bBill.summary != null) {
      bWeight = bWeight + bBill.summary.length;
    }
    return bWeight - aWeight;
  });
}

var buildBills = function() {
  var billNames = Object.keys(bills);
  sortBills(billNames);
  for (var ind in billNames) {
    var billName = billNames[ind];
    buildBill(bills[billName]);
  }
}

var committeeIcons = {
  "finance": "glyphicon glyphicon-usd",
  "banking": "glyphicon glyphicon-piggy-bank",
  "energy": "glyphicon glyphicon-flash",
  "environment": "glyphicon glyphicon-globe",
  "judiciary": "glyphicon glyphicon-tower",
  "rules": "glyphicon glyphicon-book",
  "health": "glyphicon glyphicon-apple"
};

var populateCallModal = function(senator) {
  $("#callModalTitle").html("Call Senator " + senator.first + " " + senator.last);
  $("#callModalText").html("The office of Senator " + senator.first + " " + senator.last + " can be reached by phone at <b>" + senator.phone + "</b>.");
}

var populateEmailModal = function(senator) {
  $("#emailModalTitle").html("E-mail Senator " + senator.first + " " + senator.last);
  var link = "<a href='" + senator.email + "' target='_blank'>" + senator.email + "</a>";
  $("#emailModalText").html("The office of Senator " + senator.first + " " + senator.last + " can be reached electronically at:<br><br><p class='well'>" + link + "</p>");
  $("#emailModalButton").click(function() {
    window.open(senator.email, '_blank');
  });
}

var formatAddress = function(senator) {
  var address = senator.address;
  return "Sen. " + senator.first + " " + senator.last + "<br>" + address.replace("Washington DC", "<br>Washington, DC ");
}

var populateWriteModal = function(senator) {
  $("#writeModalTitle").html("Write to Senator " + senator.first + " " + senator.last);
  $("#writeModalText").html("The office of Senator " + senator.first + " " + senator.last + " can be reached by post at:<br><br><p class='well'><b>" + formatAddress(senator) + "</b></p>");
}

window.showCallModal = function(senator) {
  var s = senators[senator];
  populateCallModal(s);
  $("#callModalButton").click(function() {
    var frame = document.getElementById("callframe");
    frame.src = "tel:" + s.phone;
  });
  $("#modalCall").modal();
}

window.showEmailModal = function(senator) {
  populateEmailModal(senators[senator]);
  $("#modalEmail").modal();
}

window.showWriteModal = function(senator) {
  populateWriteModal(senators[senator]);
  $("#modalWrite").modal();
}

var currentRow = null;
var cardsInRow = 0;
var cardsPerRow = function() {
  var domBills = $("#bills");
  var width = domBills.width();
  var perRow = Math.floor(width / CARD_WIDTH);
  return perRow;
}

var getRow = function() {
  var domBills = $("#bills");
  if (currentRow == null) {
    currentRow = $('<div class="row-fluid">');
    currentRow.appendTo(domBills);
  }
  return currentRow;
}

var processMarkdown = function(summary) {
  return markdown.toHTML(summary).replace("\\\n","<br>");
}

var makeMemberId = function(member) {
  return member.first + " " + member.last;
}

var showMembers = function(index) {
  var hiddenMembers = $("#members-" + index + " > .memberhide");
  hiddenMembers.removeClass("hidden");
  var toggleMembers = $("#members-" + index + " > .toggle-members").html('<a href="#' + index + '-bill" onClick="javascript:collapseMembers(\'' + index + '\')">Show less members <i class="glyphicon glyphicon-chevron-up"></i></a>');

}

var hideMembers = function(index) {
  var hiddenMembers = $("#members-" + index + " > .memberhide");
  hiddenMembers.addClass("hidden");
  var toggleMembers = $("#members-" + index + " > .toggle-members").html('<a href="javascript:expandMembers(\'' + index + '\')">Show all members <i class="glyphicon glyphicon-chevron-down"></i></a>');

}

window.expandBillDescription = function(index) {
  var bill = bills[inverseBillIndex(index)];
  var billDescription = $('#description-' + index);
  var collapse = $('<div class="collapse-description">').html('<a href="#' + index + '-bill" onClick="collapseBillDescription(\'' + index + '\')">Collapse summary <i class="glyphicon glyphicon-chevron-up"></i></a>');
  billDescription.html(processMarkdown(bill.summary));
  billDescription.append(collapse);
  showMembers(index);
}

window.expandMembers = function(index) {
  showMembers(index);
}

window.collapseMembers = function(index) {
  hideMembers(index);
}

window.collapseBillDescription = function(index) {
  var bill = bills[inverseBillIndex(index)];
  var billDescription = $('#description-' + index);
  var markdownText = formatSummary(bill.summary);
  var summaryHtml = processMarkdown(markdownText);
  var readMore = $('<div class="read-more">').html('<a href="javascript:expandBillDescription(\'' + formatBillIndex(bill.index) + '\')">Show full summary <i class="glyphicon glyphicon-chevron-down"></i></a>');
  billDescription.html(summaryHtml);
  billDescription.append(readMore);
  hideMembers(index);
}

var buildBill = function(bill) {

  var domRow = getRow();
  var domColumn = $('<div class="col-xl-4 col-lg-6 col-md-6 col-sm-12 col-xs-12 col">');
  domColumn.appendTo(domRow);

  var c = committees[bill.committee.toLowerCase()];

  var domBill = $('<div class="bill"><a id="' + formatBillIndex(bill.index) + '-bill"></a>').css("id", formatBillIndex(bill.index));
  domBill.appendTo(domColumn);

  var domSubrow = $('<div class="row">');
  domSubrow.appendTo(domBill);

  // title
  var domTitleCol = $('<div class="col-lg-12 col-md-12 col-sm-12 col-xs-12">');
  domTitleCol.appendTo(domSubrow);
  var domTitle = $('<div class="title">');
  domTitle.appendTo(domTitleCol);
  var domTitleNumber = $('<div class="number">').html(bill.index);
  var domTitleText = $('<div class="text">').html('<a href="https://www.congress.gov/bill/114th-congress/senate-bill/' + formatBillNumber(bill.index) + '">' + formatBillName(bill.name) + '</a>');
  domTitleNumber.appendTo(domTitle);
  domTitleText.appendTo(domTitle);

  // description
  var summaryHtml;
  var truncated = false;
  if (bill.summary != null) {
    var markdownText = formatSummary(bill.summary);
    summaryHtml = processMarkdown(markdownText);
    truncated = isSummaryTruncated(bill.summary);
  } else {
    summaryHtml = '<p class="no-summary">No summary provided</p>';
  }
  
  var domDescCol = $('<div class="col-md-8 col-lg-7 col-sm-7 col-xs-7 bill-description">');
  domDescCol.appendTo(domSubrow);

  // bernie summary
  if (bill.bernie != null) {
    var bernieHtml = processMarkdown(bill.bernie);
    var domBernie = $('<div id="bernie-' + formatBillIndex(bill.index) + '" class="bernie well"><p>').html(bernieHtml);
    domBernie.appendTo(domDescCol);
    var domBernieTitle = $('<div class="bernie heading signature">').html("- Senator Bernie Sanders");
    domBernieTitle.appendTo(domDescCol);
  }

  var domDescription = $('<div id="description-' + formatBillIndex(bill.index) + '" class="description well"><p>').html(summaryHtml);

  if (truncated) {
    var readMore = $('<div class="read-more">').html('<a href="javascript:expandBillDescription(\'' + formatBillIndex(bill.index) + '\')">Show full summary <i class="glyphicon glyphicon-chevron-down"></i></a>');
    readMore.appendTo(domDescription);
  }

  domDescription.appendTo(domDescCol);

  var summaryControls = $('<div class="full-text">').html('<a href="https://www.congress.gov/bill/114th-congress/senate-bill/' + formatBillNumber(bill.index) + '/text">Read full bill <i class="glyphicon glyphicon-share-alt"></i></a>');
  summaryControls.appendTo(domDescCol);

  // committee
  var domCommitteeCol = $('<div class="col-md-4 col-lg-5 col-sm-5 col-xs-5 small-left-gutter">');
  domCommitteeCol.appendTo(domSubrow);
  var domCommittee = $('<div class="committee">');
  domCommittee.appendTo(domCommitteeCol);

  // name
  var committeeName = $('<div class="name">');
  committeeName.append('<div class="heading title">COMMITTEE</div>');
  var committeeIconClass = committeeIcons[c.name.toLowerCase()];
  var committeeVal = $('<div class="val">').html('<i class="' + committeeIconClass + ' icon"></i> ' + c.name);
  committeeVal.appendTo(committeeName);
  committeeName.appendTo(domCommittee);

  var chair = c.chair;
  // chair
  var committeeChair = $('<div class="head">');
  committeeChair.append('<div class="heading title">COMMITTEE CHAIR</div>');
  var committeeChairVal = $('<div class="val">').html(chair.first + ' ' + chair.last);
  committeeChairVal.appendTo(committeeChair);
  var chairAffiliation = $('<div class="chair-affiliation"><div class="' + chair.party + '">' + chair.party + '</div>, ' + chair.state + '</div>');
  chairAffiliation.appendTo(committeeChair);
  committeeChair.appendTo(domCommittee);

  // action
  var action = $('<div class="action">');
  var call = $('<div class="btn btn-sm btn-success" onClick="showCallModal(\'' + makeMemberId(chair) + '\')">').append('<i class="glyphicon glyphicon-earphone"></i>');
  call.appendTo(action);
  var email = $('<div class="btn btn-sm btn-info" onClick="showEmailModal(\'' + makeMemberId(chair) + '\')">').append('<i class="glyphicon glyphicon-envelope"></i>');
  email.appendTo(action);
  var write = $('<div class="btn btn-sm btn-warning" onClick="showWriteModal(\'' + makeMemberId(chair) + '\')">').append('<i class="glyphicon glyphicon-pencil"></i>');
  write.appendTo(action);
  action.appendTo(domCommittee);

  // members
  var members = $('<div class="members" id="members-' + formatBillIndex(bill.index) + '">').append('<div class="heading title">MEMBERS (' + c.members.length + ')</div>');
  for (var ind in c.members) {
    var m = c.members[ind];
    var member = $('<div class="member">');
    if (ind > MEMBERS_PER_BILL-1) {
      member.addClass("hidden").addClass("memberhide");
    }
    var dropdown = $('<div class="dropdown">');
    var toggle = $('<div class="dropdown-toggle">').attr("data-toggle", "dropdown").attr("aria-haspopup", "true").css("aria-expanded", "true");
    toggle.append('<span class="caret"></span> ' + m.first + ' ' + m.last);
    toggle.appendTo(dropdown);
    var menu = $('<ul class="dropdown-menu">').append('<li><div class="btn btn-xs btn-success" onClick="showCallModal(\'' + makeMemberId(m) + '\')"><i class="glyphicon glyphicon-earphone"></i></div><div class="btn btn-xs btn-info" onClick="showEmailModal(\'' + makeMemberId(m) + '\')"><i class="glyphicon glyphicon-envelope"></i></div><div class="btn btn-xs btn-warning" onClick="showWriteModal(\'' + makeMemberId(m) + '\')"><i class="glyphicon glyphicon-pencil"></i></div></li>');
    menu.appendTo(dropdown);
    dropdown.appendTo(member);
    var affiliation = $('<div class="member-affiliation">').append('<div class="' + m.party + '">' + m.party + '</div>, ' + m.state);
    affiliation.appendTo(member);
    member.appendTo(members);
  }
  var expandMembers = $('<div class="toggle-members read-more">').html('<a href="javascript:expandMembers(\'' + formatBillIndex(bill.index) + '\')">Show all members <i class="glyphicon glyphicon-chevron-down"></i></a>');
  expandMembers.appendTo(members);
  members.appendTo(domCommittee);
}

var populateCommittee = function(committeeName, xml) {

  var membership = $(xml).children("committee_membership");
  var committee = membership.children("committees");
  var majorityParty = committee.children("majority_party");
  var committeeDescription = committee.children("committee_name");
  var committeeCode = committee.children("committee_code");
  var members = committee.children("members").children("member");
  // subcommittee

  var c = {
    name: committeeName,
    majorityParty: majorityParty.get(0).textContent,
    description: committeeDescription.get(0).textContent,
    code: committeeCode.get(0).textContent,
    members: []
  };

  members.each(function (ind) {
    var member = $(this);
    var memberName = member.find("name");
    var memberFirstName = memberName.find("first");
    var memberLastName = memberName.find("last");
    var state = member.find("state");
    var party = member.find("party");
    var position = member.find("position");

    var m = {
      first: memberFirstName.get(0).textContent,
      last: memberLastName.get(0).textContent,
      state: state.get(0).textContent,
      party: party.get(0).textContent,
      position: position.get(0).textContent
    };

    var memberPosition = position.get(0).textContent;
    if (memberPosition == "Chairman" || memberPosition == "Chairwoman") {
      c.chair = m;
    } else {
      c.members.push(m);
    }
  });

  committees[committeeName.toLowerCase()] = c;
}

var fetchCommittee = function(name) {
  var deferred = q.defer();
  $.ajax({
      url: "data/committees/" + name.toLowerCase() + ".xml",
      dataType: 'xml',
      type: 'GET',
      success: function(data){
        populateCommittee(name, data);
        deferred.resolve();
      },
      error: function(data) {
        console.log("error parsing XML");
        deferred.resolve();
      }
  });
  return deferred.promise;
}

var populateBills = function(data) {
  for (var ind in data) {
    var bill = data[ind];
    populateBill(bill);
  }
}

var populateSenators = function(data) {
  var contactInfo = $(data).children("contact_information");
  var member = contactInfo.children("member");
  member.each(function (ind) {
    var m = $(this);
    var last = m.children("last_name");
    var first = m.children("first_name");
    var address = m.children("address");
    var phone = m.children("phone");
    var email = m.children("email");
    var state = m.children("state");
    var key = first.get(0).textContent + " " + last.get(0).textContent;
    var senator = {
      first: first.get(0).textContent,
      last: last.get(0).textContent,
      state: state.get(0).textContent,
      address: address.get(0).textContent,
      phone: phone.get(0).textContent,
      email: email.get(0).textContent
    };
    senators[key] = senator;
  });
}

var fetchBills = function() {
  var deferred = q.defer();
  $.ajax({
      url: 'data/bills.json',
      dataType: 'json',
      type: 'GET',
      success: function(data){
        populateBills(data);
        deferred.resolve();
      }
  });
  return deferred.promise;
}

var fetchSenators = function() {
  var deferred = q.defer();
  $.ajax({
    url: 'data/senators.xml',
    dataType: 'xml',
    type: 'GET',
    success: function(data) {
      populateSenators(data);
      deferred.resolve();
    }
  });
  return deferred.promise;
}

var fetchCommittees = function() {
  var deferred = q.defer();
  var committeeList = ["Finance", "Banking", "Energy", "Environment", "Judiciary", "Rules", "Health"];
  var promises = [];
  for (var ind in committeeList) {
    var committee = committeeList[ind];
    var promise = fetchCommittee(committee);
    promises.push(promise);
  }
  q.all(promises).then(function() {
    deferred.resolve();
  });
  return deferred.promise;
}

window.fetch = function() {
  var committeePromise = fetchCommittees();
  var billPromise = fetchBills();
  var senatorPromise = fetchSenators();
  q.all([ committeePromise, billPromise, senatorPromise ]).then(function() {
    buildBills();
  });
}

