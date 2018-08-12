function out = rrefsym (mat, reduce)
% RREFSYM Reduced Row Echelon Form with Symbolic Steps
% License: GPL-3.0
% out = rrefs(mat, reduce) show step by step procedure to get to (reduced)
% row echelon form of symbolic matrix mat, then return manipulated matrix.
% Please load and initialize symbolic package before calling this function,
% matrix that is passed in needs to be already symbolic.
% WARNING: This function may not be reliable for some matrices.

% Save a copy of old matrix for comparizion
oldmat = mat;
% Cache size
[row, col] = size(mat);
% Leading entry row counter
leading = 1;
% Loop through each colomn
if (reduce)
    a = col;
else
    a = col - 1;
end % if
for c = 1:a
    % Find the first non-zero entry and put to top
    if (mat(leading, c) == 0)
        % Skip if all zeros
        if (mat(leading:row, c) == zeros(size(leading:row))')
            continue;
        end % if
        % Get leading entry to 1
        for r = leading:row
            if (mat(r, c) ~= 0)
                mat = ro_swap(mat, leading, r);
                break;
            end % if
        end % for
    end % if
    % Check if the leading entry is here
    if (mat(leading, c) ~= 0)
        % Scale the leading entry
        if (mat(leading, c) ~= 1)
            mat = ro_scale(mat, leading, 1/mat(leading, c));
        end % if
        % Zero out other rows
        if (reduce)
            a = 1;
        else
            a = leading + 1;
        end % if
        for r = a:row
            % Don't remove leading entry, ignore if it's zero already
            if (r == leading || mat(r, c) == 0)
                continue;
            end % if
            % Zero out the row
            mat = ro_add(mat, r, leading, -1 * mat(r, c));
        end % for
    end % if
    % Change leading counter
    leading = leading + 1;
    if (leading > row)
        break;
    end % if
end % if
% Assign return matrix
out = mat;
% Show results from built in function
disp('Done! Result of built in rref(): ');
disp(rref(oldmat));

% Reset formatting
format short;
end % function

function out = ro_add (mat, r_target, r_source, factor)
% Add row r_source times factor to row r_target
out = mat;
out(r_target, :) = out(r_target, :) + factor * out(r_source, :);
% Log
fprintf('R%d + (a)R%d -> R%d, where a =\n', r_target, r_source, r_target);
disp(factor);
disp('');
disp(out);
disp('');
end % function

function out = ro_scale (mat, r, factor)
% Multiply row r by factor
out = mat;
out(r, :) = out(r, :) * factor;
% Log
fprintf('(a)R%d -> R%d, where a =\n', r, r);
disp(factor);
disp('');
disp(out);
disp('');
end % function

function out = ro_swap (mat, r1, r2)
% Swap row r1 with row r2
out = mat;
out(r1, :) = mat(r2, :);
out(r2, :) = mat(r1, :);
% Log
fprintf('R%d <-> R%d\n', r1, r2);
disp('');
disp(out);
disp('');
end % function
