$(document).ready(function() {
    $('.publication-mousecell').mouseover(function() {
        var mouseoverVideo = $(this).find('video');
        var mouseoverImage = $(this).find('.mouseover-image');
        var defaultImage = $(this).find('img').not('.mouseover-image');

        if (mouseoverVideo.length > 0) {
            mouseoverVideo.css('display', 'inline-block');
            defaultImage.css('display', 'none');
        } else if (mouseoverImage.length > 0) {
            mouseoverImage.css('display', 'inline-block');
            defaultImage.css('display', 'none');
        }
    });

    $('.publication-mousecell').mouseout(function() {
        var mouseoverVideo = $(this).find('video');
        var mouseoverImage = $(this).find('.mouseover-image');
        var defaultImage = $(this).find('img').not('.mouseover-image');

        if (mouseoverVideo.length > 0) {
            mouseoverVideo.css('display', 'none');
            defaultImage.css('display', 'inline-block');
        } else if (mouseoverImage.length > 0) {
            mouseoverImage.css('display', 'none');
            defaultImage.css('display', 'inline-block');
        }
    });
});
