(defun make-nextpage-regexp ()
  (interactive)
  (let ((next "next|nächste|Suivant|Следующая")
	(next-page "next page|Nächste Seite|la page suivante|следующей страницы"))
    (format "var nextPattern = /(?:(^|>)(%s)(<|$)|(^|>\\s*)(%s)(\\s*<|$| ?(?:»|›|&gt;)|1?\\.(?:gif|jpg|png))|^(››| ?(&gt;)+ ?)$|(下|后)一?(?:页|糗事|章|回|頁)|^(Next Chapter|Thread Next|Go to next page))/i;" next-page next)))

(defun insert-nextpage-regexp ()
  (interactive)
  (insert (make-nextpage-regexp)))
