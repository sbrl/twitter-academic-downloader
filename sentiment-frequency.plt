set title sprintf("%s\n{/*0.5 %s}", graph_title, graph_subtitle) font "Ubuntu,24"
set xlabel "Epochs"
set ylabel "Percentage (normalised)"
#set key autotitle columnhead font "Ubuntu, 22"
set rmargin 15
set key title "Legend" font "Ubuntu,22" at screen 1, graph 1
set grid
set timefmt "%Y-%m-%d"
set xdata time
set format x "%Y-%m-%d" # Display format
set datafile separator "\t"

set key opaque
set autoscale y
#set yrange [0:]

set datafile separator "\t"
set terminal png linewidth 3 size 2000, 500 font "Ubuntu,20"

#plot data_filename using 1:2 with lines linewidth 5 title "Positive (absolute)"
# plot \
# 	data_filename using 1:8 with filledcurves x linecolor "#da3a30" title "Negative", \
# 	data_filename using 1:6 with filledcurves x linecolor "#00683b" title "Positive", \
# 	data_filename using 1:5 with lines title "Frequency"
plot \
	data_filename using 1:8 with filledcurves x linecolor "#00683b" title "Positive", \
	data_filename using 1:7 with filledcurves x linecolor "#da3a30" title "Negative", \
	data_filename using 1:5 with lines title "Frequency"
