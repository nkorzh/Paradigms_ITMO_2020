;(ns object_expr)

(definterface IExpr
  (_evaluate [vars])
  (_diff [diffvar])
  (_toString [])
  (_toStringSuffix [])
  (_toStringInfix []))

(declare ZERO)

(deftype TConst [value]
  IExpr
  (_evaluate [_ _] value)
  (_diff [_ _] ZERO)
  (_toString [this] (format "%.1f" (double (.value this))))
  (_toStringSuffix [this] (._toString this))
  (_toStringInfix [this] (._toString this)))

(def ZERO (new TConst 0.0))
(def ONE (new TConst 1.0))
(def TWO (new TConst 2.0))

(deftype TVariable [name]
  IExpr
  (_evaluate [_ vars] (vars name))
  (_diff [_ diffvar] (if (= name diffvar) ONE ZERO))
  (_toString [_] (str name))
  (_toStringSuffix [_] (str name))
  (_toStringInfix [_] (str name)))

(deftype IUnaryOperation [f diff op-symbol a]
  IExpr
  (_evaluate [_ vars] (f (._evaluate a vars)))
  (_diff [_ diffvar] (diff diffvar))
  (_toString [_] (str "(" op-symbol " " (._toString a) ")"))
  (_toStringSuffix [_] (str "(" (._toStringSuffix a) " " op-symbol ")"))
  (_toStringInfix [_] (str op-symbol "(" (._toStringInfix a) ")")))

(deftype IMultipleOperation [f diff op-symbol args]
  IExpr
  (_evaluate [this vars] (apply f (map #(._evaluate % vars) (.args this))))
  (_diff [_ diffvar] (diff diffvar))
  (_toString [this] (str "(" op-symbol " " (clojure.string/join " " (map #(._toString %) (.args this))) ")"))
  (_toStringSuffix [this] (str "(" (clojure.string/join " " (map #(._toStringSuffix %) (.args this))) " " op-symbol ")"))
  (_toStringInfix [this] (str "(" (clojure.string/join (map #(str (._toStringInfix %) " " op-symbol) (butlast (.args this)))) " " (._toStringInfix (last (.args this))) ")")))

(defn evaluate [obj vars] (._evaluate obj vars))
(defn toString [obj] (._toString obj))
(defn toStringSuffix [expression] (._toStringSuffix expression))
(defn toStringInfix [expression] (._toStringInfix expression))
(defn diff [expr diffvar] (._diff expr diffvar))
(defn Constant [value] (new TConst value))
(defn Variable [name] (new TVariable name))

(declare Square)
(declare Ln)

(defn Add [& args] (new IMultipleOperation + (fn [diffvar] (apply Add (map #(diff % diffvar) args))) '+ args))
(defn Subtract [& args] (new IMultipleOperation - (fn [diffvar] (apply Subtract (map #(diff % diffvar) args))) '- args))
(defn Multiply [& args] (new IMultipleOperation *
                             (fn [diffvar] (reduce #(Add (Multiply %1 (diff %2 diffvar)) (Multiply %2 (diff %1 diffvar))) args)) '* args))
(defn Divide [& args] (new IMultipleOperation #(/ %1 (double %2))
                           (fn [diffvar] (reduce #(Divide (Subtract (Multiply %2 (diff %1 diffvar)) (Multiply %1 (diff %2 diffvar))) (Square %2)) args)) '/ args))

(defn Lg [& args] (let [a (first args)
                        b (second args)]
  (new IMultipleOperation #(/ (Math/log (Math/abs (double %2))) (Math/log (Math/abs (double %1))))
                        (fn [diffvar] (Divide (Subtract (Multiply (diff b diffvar) (Divide (Ln a) b)) (Multiply (diff a diffvar) (Divide (Ln b) a)))
                                              (Square (Ln a)))) 'lg args)) )
(defn Ln [a] (Lg (Constant Math/E) a))
(defn Pw [& args] (let [a (first args)
                        b (second args)]
  (new IMultipleOperation #(Math/pow (double %1) (double %2))
                          (fn [diffvar] (Multiply (Pw a b) (diff (Multiply (Ln a) b) diffvar))) 'pw args)))

(defn Negate [a] (new IUnaryOperation - #(Negate (diff a %)) 'negate a))
(defn Square [a] (new IUnaryOperation #(* % %) #(Multiply (diff a %) (Multiply TWO a)) 'square a))

(defn And [& args]
  (new IMultipleOperation #(Double/longBitsToDouble (bit-and (Double/doubleToLongBits %1) (Double/doubleToLongBits %2)))
                           (constantly [nil])
                           '& args))
(defn Or [& args]
  (new IMultipleOperation  #(Double/longBitsToDouble (bit-or (Double/doubleToLongBits %1) (Double/doubleToLongBits %2)))
                            (constantly [nil])
                            '| args))
(defn Xor [& args]
  (new IMultipleOperation #(Double/longBitsToDouble (bit-xor (Double/doubleToLongBits %1) (Double/doubleToLongBits %2)))
                           (constantly [nil])
                           (symbol "^") args))

(def object-operations {
                        '+ Add
                        '- Subtract
                        '* Multiply
                        '/ Divide
                        'negate Negate
                        'lg Lg
                        'pw Pw
                        'square Square
                        '| Or
                        '& And
                        (symbol "^") Xor
                        })

(defn parse [expr]
  (cond
    (list? expr) (apply (object-operations (first expr)) (map parse (rest expr)))
    (number? expr) (Constant expr)
    :else (Variable (str expr))))

(defn parseObject [expression] (parse (read-string expression)))
