const
        fon = 'cashier.in1';
var
	i, j : longint;

begin
  randomize;
  assign(output, fon); rewrite(output);
  writeln(200200, ' ', 10000);
  for i := 1 to 100 do begin
    for j := 1 to 1000 do
      writeln('I ', random(100000));
    writeln('A ', random(100));
    writeln('S ', random(1000));
    for j := 1 to 1000 do
      writeln('F ', i * (random(1000) + 1));
  end;
  close(output);
end.





