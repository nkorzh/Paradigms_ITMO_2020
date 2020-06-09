;; Combinator parsers
;(load-file "functional_expr.clj")
(load-file "object_expr.clj")
(load-file "combinators_lib.clj")


(def *digit (+char "0123456789"))
(def *digits (+str (+plus *digit)))
(def *number (+map read-string (+str (+seq (+opt (+map str (+char "-"))) *digits (+opt (+str (+seq (+char ".") *digits)))))))

(def *string
  (+seqn 1 (+char "\"") (+str (+star (+char-not "\""))) (+char "\"")))
(def *all-chars (mapv char (range 32 128)))
(def *letter (+char (apply str (filter #(Character/isLetter %) *all-chars))))

(def *null (+seqf (constantly 'null) (+char "n") (+char "u") (+char "l") (+char "l")))
(def *space (+char " \t\n\r"))
(def *whiteSpace (+ignore (+star *space)))

(def *char #(+seqn 0 *whiteSpace (+char %)))
(def *symbol #(+map (comp symbol str) (*char %)))
(def *identifier (+str (+seqf cons *letter (+star (+or *letter *digit)))))

(defn *seq [begin p end] (+seqn 1 (+char begin) (+plus (+seqn 0 *whiteSpace p)) *whiteSpace (+char end)))
(defn *list_of [expected_value] (*seq "(" (delay expected_value) ")"))


(def *constant (+map Constant (+seqn 0 *whiteSpace *number *whiteSpace)))
(def *variable (+map (comp Variable str) (+seqn 0 *whiteSpace (+char "xyz"))))
(def *open (+ignore (*char "(")))
(def *close (+ignore (*char ")")))

(declare *prim)
(def *negate (+map #(Negate %) (+seqn 1 *whiteSpace (+string "negate") (delay *prim))))

; easy modification
(def *operations (+map str (+char "+-*/&|^")))

(def *operationsOrVariable (+map (comp #(object-operations % (Variable (str %))) symbol) (+str (+plus (+or *letter *operations)))))
(declare *value)
(def *list (+map (fn [list] (apply (last list) (butlast list))) (*seq "(" (delay *value) ")")))
(def *value (+or *constant *operationsOrVariable *list))
(def parseObjectSuffix (+parser (+seqn 0 *whiteSpace *value *whiteSpace)))


(defn *read [*op *next]
  (+map #(reduce (fn [a b] ((object-operations (nth b 0)) a (nth b 1))) (first %) (last %))
        (+seq *next (+star (+seq *op *next)))))

; hard modification
(declare *expression)

(def *prim (+or *constant *variable *negate (+seqn 0 *open (delay *expression) *close)))
(def *MulDiv (*read (*symbol "*/") *prim))
(def *AddSub (*read (*symbol "+-") *MulDiv))
(def *And (*read (*symbol "&") *AddSub))
(def *Or (*read (*symbol "|") *And))
(def *Xor (*read (*symbol "^") *Or))

(def *expression *Xor)

(def parseObjectInfix (+parser (+seqn 0 *expression *whiteSpace)))
