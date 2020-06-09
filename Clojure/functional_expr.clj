; functional expression - min/max modification
(defn unaryOperation [f] #(fn [varmap] (f (% varmap))))

(defn multipleOperation [f] (fn [& args] (fn [varmap] (apply f (map #(% varmap) args)))))
(defn multiBinary [f] (fn [& args] (fn [varmap] (reduce f (map #(% varmap) args)))))

(defn constant [value] (constantly value))
(defn variable [name] (fn [map] (map name)))

(def negate (unaryOperation -'))
(def subtract (multipleOperation -))
(def divide (multipleOperation #(/ %1 (double %2))))
(def add (multipleOperation +))
(def multiply (multipleOperation *))
(def min (multiBinary #(Math/min %1 %2)))
(def max (multiBinary #(Math/max %1 %2)))

(def variables
  {'x (variable "x")
   'y (variable "y")
   'z (variable "z")})

(def function-operations
  {'negate negate
   '+      add
   '-      subtract
   '*      multiply
   '/      divide
   'min    min
   'max    max})

(defn parse [expr]
  (cond
    (list? expr)
    (apply (function-operations (first expr))
           (map parse (rest expr)))
    (number? expr) (constant expr)
    (contains? variables expr) (variables expr)
    (contains? function-operations expr) (function-operations expr)))

(defn parseFunction [expression]
  (parse (read-string expression)))
