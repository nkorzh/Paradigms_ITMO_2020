; Author: Kozhukharov Nikita
(defn AbstractOperation [f & args]
  (if (number? (first args))
    (apply f args)
    (apply mapv (partial AbstractOperation f) args)))

(defn cmpall [f args] (if (= (count args) 0) true (apply = (AbstractOperation f args))))
(defn cmptype [args] (if (number? (first args))
                       (AbstractOperation number? args)
                       (if (vector? (first args))
                         (AbstractOperation vector? args)
                         false)))
(defn cmpveclen [args] (cmpall (fn [a] (if (number? a) true (count a))) args))
; проверка на одинаковые типы и длину всех аргументов и их вложенных элементов
(defn cmpArgsForMultiVecOp [args] (and (cmptype args) (if (vector? (first args)) (cmpveclen args) true)))

(defn ScalarMultiOp [f operType args] {:pre  [(cmpArgsForMultiVecOp args)]
                                       :post [(if (number? (first args))
                                              (number? %)
                                              (and (vector? %) (cmpveclen [% (first args)])))]}
  (apply (partial operType f) args))


(defn s+ [& args] (ScalarMultiOp + AbstractOperation args))
(defn s- [& args] (ScalarMultiOp - AbstractOperation args))
(defn s* [& args] (ScalarMultiOp * AbstractOperation args))

(defn VectorOperation [f args] {:pre [(vector? (first args)) (cmpArgsForMultiVecOp args)]
                                :post [(vector? %) (cmpArgsForMultiVecOp (conj args %))]}
  (reduce f args))

(defn v+ [& args] (VectorOperation s+ args))
(defn v- [& args] (VectorOperation s- args))
(defn v* [& args] (VectorOperation s* args))

(defn v*s [v & scalars] {:pre [(number? (first scalars)) (cmptype scalars) (vector? v)]
                         :post [(vector? %) (cmpveclen [v %])]}
  (mapv (partial * (reduce * scalars)) v))

(defn scalar [v0 v1] {:pre  [(cmpveclen [v0 v1])]
                      :post [(number? %)]}
  (reduce + (v* v0 v1)))

(defn vect [& args]
  (VectorOperation (fn [v0 & [v1]] (if v1
      (let [x0 (first v0)
            y0 (second v0)
            z0 (last v0)
            x1 (first v1)
            y1 (second v1)
            z1 (last v1)]
      (vector
        (- (* y0 z1) (* y1 z0))
        (- (* z0 x1) (* x0 z1))
        (- (* x0 y1) (* y0 x1))
        ))
       v0))
  args)
)

; так как внутри используется v_, который основан на VectorOperation, то все вложенные проверки будут произведены
; достаточно проверить на равенство количество строк
(defn MatrixOperation [f args] {:pre [(cmpveclen args)]
                                :post [(vector? %) (= (mapv (partial count) [(first args) %]))]}
  ; после предусловия достаточно сравнить результат с первым элементом
  (reduce f args))

(defn m+ [& args] (MatrixOperation v+ args))
(defn m- [& args] (MatrixOperation v- args))
(defn m* [& args] (MatrixOperation v* args))
(defn m*s [m & scalars] {:pre [(vector? (first m))]
                         :post [(cmptype [m %]) (cmpveclen [m %])]}
  (mapv (fn [v] (apply v*s v scalars)) m))
(defn m*v [m v] (mapv (partial scalar v) m))
(defn transpose [m] (apply mapv vector m))


(defn m*m [& args] (reduce (fn [m1 m2] {:pre [(cmpveclen m1) (cmpveclen m2) (= (mapv count [(first m1) m2]))]
                                        :post [(cmpveclen %) (= (mapv count (mapv first [% m2])))
                                               (= (mapv count [% m1]))]}
  (transpose (mapv (partial m*v m1) (transpose m2)))) args))

