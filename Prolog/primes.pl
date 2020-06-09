
prime(N) :- \+ composite(N).

mark_delt_composite(N, DELTA, MaxN) :-
	N < MaxN, !,
	Next is N + DELTA,
    assertz(composite(N)),
	mark_delt_composite(Next, DELTA, MaxN).

mark_delt_composite(_, _, _) :- !.

eratosfen(MaxN, MaxN) :- !.

eratosfen(N, MaxN) :-
	N2 is N * N,
  !,
	DELTA is N * 2,
	mark_delt_composite(N2, DELTA, MaxN),
    make_next(N),
	NextPrime is N + 2,
	eratosfen(NextPrime, MaxN).

make_next(Next) :-
    prime(Next), !,
    last_prime_number(LastNumber),
    retract(last_prime_number(LastNumber)),
    NextNumber is LastNumber + 1,
    assertz(last_prime_number(NextNumber)),
    assertz(nth_prime(NextNumber, Next)),
    greatest_prime(Last),
    retract(greatest_prime(Last)),
    assertz(next_prime(Last, Next)),
    assertz(greatest_prime(Next)).
make_next(_) :- !.

init(MAX_N) :-
    mark_delt_composite(4, 2, MAX_N),
    assertz(greatest_prime(2)),
    assertz(nth_prime(1, 2)),
    assertz(last_prime_number(1)),
    ODD_N is MAX_N + 1,
    eratosfen(3, ODD_N).

prime_divisors(N, Divisors) :-
    number(N), !,
    divisible(N, 2, [], List), reverse(List, Divisors).
prime_divisors(N, Divisors) :-
    multiply_all(Divisors, 1, 1, N).

update(X, Y, 1, X, L, L1) :-
    prime(X), !,
    L1 = [X | L].

update(X, Y, XR, Y, L, L1) :-
    R is mod(X, Y),
    0 == R, !,
    XR is div(X, Y),
    L1 = [Y | L].

update(X, Y, X, YR, L, L) :- next_prime(Y, YR), !.

divisible(X, Y, INITLIST, RES) :-
    Y =< X, !,
    update(X, Y, XR, YR, INITLIST, TMP),
    divisible(XR, YR, TMP, RES).

divisible(_, _, INITLIST, INITLIST) :- !.

multiply_all(LIST, LASTM, CUR, RES) :-
    LIST = [HEAD | TAIL],
    number(HEAD), !,
    HEAD >= LASTM,
    TMP is CUR * HEAD,
    multiply_all(TAIL, HEAD, TMP, RES).

multiply_all(_, _, CUR, CUR).