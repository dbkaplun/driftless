/*global require*/

var jQuery = require('jquery');

var test = require('tape');

test.createStream({objectMode: true}).on('data', function (row) {
  jQuery(function ($) {
    var $test;
    switch (row.type) {
    case 'test':
      var parentId = '#test';
      if (row.parent) {
        parentId += '-' + row.parent;
      } else if (row.id !== 0) { // FIXME
        parentId += '-0';
      } else {
        parentId += 's';
      }
      $(parentId)
        .append($('<div>', {id: 'test-' + row.id, 'class': 'test'})
          .data({ok: true})
          .append($('<span>', {'class': 'test-info'})
            .append($('<span>', {'class': 'test-name'}).text(row.name))));
      break;
    case 'assert':
      $test = $('#test-' + row.test);
      $test.data({ok: $test.data('ok') && row.ok});
      break;
    case 'end':
      $test = $('#test-' + row.test);
      $test.children('.test-info:first-child').children('.test-name:first-child')
        .prepend($('<span>', {'class': 'glyphicon'})
          .addClass($test.data('ok') ? 'glyphicon-ok text-success' : 'glyphicon-remove text-danger'));
      break;
    }
  });
});

require('../test/index');
